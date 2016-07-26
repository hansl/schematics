// import * as path from 'path';
// import {template} from 'lodash';
//
// import {Compiler, CompileResult} from '../api/compiler';
// import {Context, Entry, StaticEntry, MoveEntry} from '../api/entry';
//
//
// /**
//  * A compiler which uses Lodash template for the entry content. Does not act on the path.
//  */
// export class LodashTemplateCompiler extends Compiler {
//   compile(entry: Entry, context?: Context) {
//     const compiledFn = template(entry.content);
//     return new StaticEntry(entry.path, entry.name, compiledFn(context));
//   }
// }
//
//
// /**
//  * A compiler that replaces tokens in the path and name of the entries, but does not act
//  * on the content.
//  */
// export class PathChangeCompiler extends Compiler {
//   constructor(private _tokenRegex: RegExp = /__(.*?)__/g) {
//     super();
//   }
//
//   private _replace(s: string, context: Context) {
//     return s.replace(this._tokenRegex, (m, name) => context[name]);
//   }
//
//   compile(entry: Entry, context: Context) {
//     const path = entry.path;
//     const name = entry.name;
//
//     return new MoveEntry(entry, this._replace(path, context), this._replace(name, context));
//   }
// }
//
//
// /**
//  * Remove entries that match certain criterias. By default remove entries that are dotfiles.
//  */
// export class FilterCompiler extends Compiler {
//   // Need at least 2 characters.
//   constructor(private _pathMatch = /^\.[^.]|^\.\.[^.]/, private _fileMatch = /^\.[^.]/) {
//     super();
//   }
//
//   compile(entry: Entry) {
//     if (this._fileMatch.test(entry.name) ||
//         entry.path.split(path.sep).some(x => this._pathMatch.test(x))) {
//       return null;
//     } else {
//       return entry;
//     }
//   }
// }
//
//
// /**
//  * A compiler that supports merging multiple compilers together, running them in order they were
//  * passed in.
//  */
// export class MergeCompiler extends Compiler {
//   private _compilers: Compiler[] = null;
//   constructor(...compilers: Compiler[]) {
//     super();
//     this._compilers = compilers;
//   }
//
//   compile(entry: Entry, context: Context): CompileResult {
//     // Chain the promises one by one because we don't know if the compilers below us are
//     // returning a promise or a value.
//     return this._compilers.reduce((prev, compiler) => {
//       return prev
//         .then(e => e && compiler.compile(e, context));
//       }, Promise.resolve(entry));
//   }
// }
//
//
// /**
//  * Default compiler, which changes __XXX__ in path/name and use Lodash for the content of
//  * the templates.
//  * @type {MergeCompiler}
//  */
// export const defaultCompiler = new MergeCompiler(
//     new PathChangeCompiler(),
//     new LodashTemplateCompiler());
//
//
// /**
//  * A compiler that returns the content, unmodified, of the entry.
//  */
// export class IdentityCompiler extends Compiler {
//   compile(entry: Entry) {
//     return entry;
//   }
// }
//
//
// /**
//  * A compiler that calls a function for transformation.
//  */
// export class FunctionCompiler extends Compiler {
//   constructor(private _fn: (entry?: Entry, context?: Context) => CompileResult) {
//     super();
//   }
//   compile(entry: Entry, context: Context) {
//     return this._fn(entry, context);
//   }
// }
