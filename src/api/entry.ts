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
