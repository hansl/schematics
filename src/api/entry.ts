import {Compiler, CompiledFn} from '../api/compiler';
import {BaseException} from '../core/exception';


export class CannotConcatEntriesException extends BaseException {}


export type Context = { [name: string]: any };
export type TransformerFn = (entry: Entry, context?: Context) => Promise<Entry> | Entry;


/**
 * An entry in the schematics. A file, basically.
 */
export interface Entry {
  readonly name: string;
  readonly path: string;
  readonly content: string;

  transform(context: Context): Promise<Entry> | Entry;
}


export class CompilableEntry implements Entry {
  private _path: string;
  private _template: string = null;
  private _compiled: Promise<CompiledFn> | CompiledFn;

  get name(): string { return this._name; }
  get path(): string { return this._path; }
  get content(): string { return this._template; }

  constructor(path: string, private _name: string, private _compiler: Compiler) {
    this._path = path || '/';
  }

  get template(): string {
    return this._template;
  }
  set template(v: string) {
    this._template = v;
    if (v !== null) {
      this._compiled = this._compiler.compile(this);
    } else {
      this._compiled = null;
    }
  }

  transform(context?: Context): Promise<Entry> {
    return Promise.resolve()
      .then(() => this._compiled)
      .then(compiler => compiler ? compiler(context || {}) : null);
  }
}


export class StaticEntry implements Entry {
  constructor(public path: string, public name: string, public content: string) {}

  transform(context: Context): Promise<Entry> | Entry {
    return this;
  }
}


export class MoveEntry implements Entry {
  constructor(private _entry: Entry, private _path: string, private _name: string) {}

  get name() { return this._name; }
  get path() { return this._path; }
  get content() { return this._entry.content; }

  transform(context: Context) {
    return Promise.resolve()
      .then(() => this._entry.transform(context))
      .then(newE => new MoveEntry(newE, this._path, this._name));
  }
}


export class TransformEntry implements Entry {
  constructor(private _entry: Entry, private _transformer: TransformerFn) {}

  get name() { return this._entry.name; }
  get path() { return this._entry.path; }
  get content() { return this._entry.content; }

  transform(context: Context): Promise<Entry> {
    return Promise.resolve()
      .then(() => this._entry.transform(context))
      .then(newEntry => this._transformer(newEntry, context));
  }
}


export class ConcatEntry implements Entry {
  constructor(private _e1: Entry, private _e2: Entry) {
    if (_e1.path !== _e2.path || _e1.name !== _e2.name) {
      throw new CannotConcatEntriesException();
    }
  }

  get name() { return this._e1.name; }
  get path() { return this._e1.path; }
  get content() { return '' + this._e1.content + this._e2.content; }

  transform(context: Context): Promise<Entry> {
    return Promise.all([this._e1.transform(context), this._e2.transform(context)])
      .then(([e1, e2]) => new ConcatEntry(e1, e2));
  }
}
