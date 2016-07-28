import {BaseException} from './exception';

import {defaultsDeep} from 'lodash';

export class CannotConcatEntriesException extends BaseException {}


/**
 * An entry in the schematics. A file, basically.
 */
export interface Entry {
  readonly name: string;
  readonly path: string;
  readonly content: string;
}


export class StaticEntry implements Entry {
  constructor(public path: string, public name: string, public content: string) {}
}


export class MoveEntry implements Entry {
  constructor(private _entry: Entry, private _path: string, private _name: string) {}

  get name() { return this._name; }
  get path() { return this._path; }
  get content() { return this._entry.content; }
}


export class ConcatEntry implements Entry {
  constructor(private _e1: Entry, private _e2: Entry) {
    if (!_e1 || !_e2 || _e1.path !== _e2.path || _e1.name !== _e2.name) {
      throw new CannotConcatEntriesException();
    }
  }

  get name() { return this._e1.name; }
  get path() { return this._e1.path; }
  get content() { return '' + this._e1.content + this._e2.content; }
}


export class MergeJsonEntry implements Entry {
  private _content: string;

  constructor(private _e1: Entry, private _e2: Entry, private _indent = 2) {
    if (!_e1 || !_e2 || _e1.path !== _e2.path || _e1.name !== _e2.name) {
      throw new CannotConcatEntriesException();
    }

    const e1 = JSON.parse(_e1.content);
    const e2 = JSON.parse(_e2.content);

    this._content = JSON.stringify(defaultsDeep(e2, e1), null, this._indent);
  }

  get name() { return this._e1.name; }
  get path() { return this._e1.path; }
  get content() { return this._content; }
}
