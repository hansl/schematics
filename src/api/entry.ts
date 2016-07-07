import {Compiler, CompiledFn} from 'api/compiler';


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
  private _template: string = null;
  private _compiled: Promise<CompiledFn> | CompiledFn;

  get name(): string { return this._name; }
  get path(): string { return this._path; }
  get content(): string { return this._template; }

  constructor(private _path: string, private _name: string, private _compiler: Compiler) {
    this._path = _path || '/'
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
  constructor(private _entry: Entry, private _name: string, private _path: string) {}

  get name() { return this._name; }
  get path() { return this._path; }
  get content() { return this._entry.content; }

  transform(context: Context) { return this._entry.transform(context); }
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
