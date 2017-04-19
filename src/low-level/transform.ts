import * as path from 'path';
import { Observable } from 'rxjs/Observable';
import { template } from 'lodash';

import { Action, CreateAction } from './action';
import { BaseException } from '../exception';

import 'rxjs/add/operator/map';


export interface JsonObject {
  [key: string]: any;
}

export interface TransformFactory {
  (options: JsonObject): TransformFunction;
}

export interface TransformFunction {
  (source: Observable<Action>): Observable<Action>;
}

export function PrependRoot(options: JsonObject): TransformFunction {
  return (source: Observable<Action>) => {
    return source.map(action => {
      if (action instanceof CreateAction) {
        return path.isAbsolute(action.path)
          ? action
          : new CreateAction(
            path.join(options.root, action.path), action.isDirectory, action.content
          );
      }
      return action;
    });
  };
}

export function LodashCompiler(options: JsonObject): TransformFunction {
  return (source: Observable<Action>) => {
    return source.map(action => {
      if (action instanceof CreateAction) {
        const compiledContent = template(action.content)(options.variables);
        return new CreateAction(action.path, action.isDirectory, compiledContent);
      }
      return action;
    });
  };
}

export class InvalidKeyException extends BaseException {}
export type PathRemapperOptions = {
  ignoreUnknownKeys?: boolean;
  tokenRegex?: RegExp;
};

export function PathRemapper(context: JsonObject, options: PathRemapperOptions = {
  ignoreUnknownKeys: false,
  tokenRegex: /__(.*?)__/g
}) {
  return (input: Observable<Action>) => {
    function replace(s: string) {
      return s.replace(options.tokenRegex, (m: string, name: string) => {
        if (name in context) {
          return context[name];
        } else if (options.ignoreUnknownKeys) {
          throw new InvalidKeyException();
        } else {
          return '';
        }
      });
    }

    return input.map(action => {
      if (action instanceof CreateAction && action.path.match(options.tokenRegex)) {
        return new CreateAction(replace(action.path), action.isDirectory, action.content);
      }
      return action;
    });
  };
}

export function LogActions(): TransformFunction {
  return (source: Observable<Action>) => {
    return source.map(action => {
      if (action instanceof CreateAction) {
        console.log(`Creating ${action.path}`);
      }
      return action;
    });
  };
}
