import {Entry, StaticEntry, MoveEntry, ConcatEntry, MergeJsonEntry, RootEntry} from './entry';
import {BaseException} from './exception';

import {template} from 'lodash';
import * as path from 'path';
import {Observable} from 'rxjs/Observable';

import 'rxjs/add/operator/groupBy';
import 'rxjs/add/operator/let';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/merge';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/partition';
import 'rxjs/add/operator/reduce';


export type TransformFn = (input: Observable<Entry>) => Observable<Entry>;
export type Context = {[key: string]: any};


export class InvalidKeyException extends BaseException {}


export function LodashCompiler(context: Context): TransformFn {
  return (input: Observable<Entry>) => {
    return input.map(entry => {
      return new StaticEntry(entry.path, entry.name, template(entry.content)(context));
    });
  };
}


export type PathRemapperOptions = {
  ignoreUnknownKeys?: boolean;
  tokenRegex?: RegExp;
};


export function PathRemapper(context: Context, options: PathRemapperOptions = {
  ignoreUnknownKeys: false,
  tokenRegex: /__(.*?)__/g
}) {
  return (input: Observable<Entry>) => {
    function replace(s: string) {
      return s.replace(options.tokenRegex, (m, name) => {
        if (name in context) {
          return context[name];
        } else if (options.ignoreUnknownKeys) {
          throw new InvalidKeyException();
        } else {
          return '';
        }
      });
    }

    return input.map(entry => {
      return new MoveEntry(entry, replace(entry.path), replace(entry.name));
    });
  };
}


export function PrependRoot(root: string) {
  return (input: Observable<Entry>) => {
    return input.map(entry => path.isAbsolute(entry.path) ? entry : new RootEntry(entry, root));
  };
}


export type MergeEntryFactory = (a: Entry, b: Entry) => Entry | Promise<Entry>;

export function MergeDuplicatesWith(factory: MergeEntryFactory) {
  return (input: Observable<Entry>) => {
    return input
      .groupBy(entry => path.join(entry.path, entry.name))
      .mergeMap(obs => {
        return obs.reduce(function(acc: Entry | null, curr: Entry) {
          if (acc === null) {
            return curr;
          }
          return factory(acc, curr);
        }, null);
      });
  };
}


export function ConcatDuplicates(): TransformFn {
  return MergeDuplicatesWith((a, b) => new ConcatEntry(a, b));
}


export function MergeJsonDuplicates(indent = 2): TransformFn {
  return MergeDuplicatesWith((a, b) => new MergeJsonEntry(a, b, indent));
}


export function Splice(predicate: (e: Entry) => boolean, transform: TransformFn) {
  return (input: Observable<Entry>) => {
    const [match, rest] = input.partition(predicate);
    return match.let(transform).merge(rest);
  };
}
