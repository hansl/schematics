export type Context = { [name: string]: any };
export type TransformerFn = (output: string, context?: Context) => Promise<string> | string;


/**
 * An entry in the schematics. It can be a directory, a file, or anything else.
 */
export interface Entry {
  readonly name: string;
  readonly path: string;

  scaffold(context: Context): Promise<string> | string;
}


export class MoveEntry implements Entry {
  constructor(private _entry: Entry, private _name: string, private _path: string) {}

  get name() { return this._name; }
  get path() { return this._path; }

  scaffold(context: Context) { return this._entry.scaffold(context); }
}


export class TransformEntry implements Entry {
  constructor(private _entry: Entry, private _transformer: TransformerFn) {}

  get name() { return this._entry.name; }
  get path() { return this._entry.path; }

  scaffold(context: Context): Promise<string> {
    return Promise.resolve()
      .then(() => this._entry.scaffold(context))
      .then(output => this._transformer(output, context))
  }
}
