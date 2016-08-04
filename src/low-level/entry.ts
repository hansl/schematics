import {BaseException} from '../exception';

import {defaultsDeep} from 'lodash';
import * as path from 'path';

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
  constructor(protected _entry: Entry, private _path: string, private _name: string) {}

  get name() { return this._name; }
  get path() { return this._path; }
  get content() { return this._entry.content; }
}


export class RootEntry extends MoveEntry {
  constructor(_entry: Entry, private _root: string) {
    super(_entry, path.join(_root, _entry.path), _entry.name);
  }

  get relativeName() { return this._entry.path; }
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
