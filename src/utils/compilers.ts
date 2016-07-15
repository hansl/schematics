import {template} from 'lodash';

import {Compiler, CompiledFn} from '../api/compiler';
import {Context, Entry, StaticEntry, MoveEntry} from '../api/entry';


/**
 * A compiler which uses Lodash template for the entry content. Does not act on the path.
 */
export class LodashTemplateCompiler extends Compiler {
  compile(entry: Entry) {
    const compiledFn = template(entry.content);
    return (context: Context) => {
      return new StaticEntry(entry.path, entry.name, compiledFn(context));
    }
  }
}


/**
 * A compiler that replaces tokens in the path and name of the entries, but does not act
 * on the content.
 */
export class PathChangeCompiler extends Compiler {
  constructor(private _tokenRegex: RegExp = /__(.*?)__/g) {
    super();
  }

  private _replace(s: string, context: Context) {
    return s.replace(this._tokenRegex, (m, name) => context[name]);
  }

  compile(entry: Entry) {
    const path = entry.path;
    const name = entry.name;
    return (context: Context) => {
      return new MoveEntry(entry, this._replace(path, context), this._replace(name, context));
    };
  }
}


/**
 * A compiler that supports merging multiple compilers together, running them in order they were
 * passed in.
 */
export class MergeCompiler extends Compiler {
  private _compilers: Compiler[] = null;
  constructor(...compilers: Compiler[]) {
    super();
    this._compilers = compilers;
  }

  compile(entry: Entry): CompiledFn {
    return (context: Context): Promise<Entry> => {
      // Chain the promises one by one because we don't know if the compilers below us are
      // returning a promise or a value.
      return this._compilers.reduce((prev, compiler) => {
        return prev
          .then(e => compiler.compile(e))
          .then(fn => fn(context));
        }, Promise.resolve(entry));
    }
  }
}


/**
 * Default compiler, which changes __XXX__ in path/name and use Lodash for the content of
 * the templates.
 * @type {MergeCompiler}
 */
export const defaultCompiler = new MergeCompiler(
    new PathChangeCompiler(),
    new LodashTemplateCompiler());


/**
 * A compiler that returns the content, unmodified, of the entry.
 */
export class IdentityCompiler extends Compiler {
  compile(entry: Entry) {
    return () => entry;
  }
}
