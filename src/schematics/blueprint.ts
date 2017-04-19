import * as path from 'path';
import * as fs from 'fs';
import { Observable } from 'rxjs/Observable';

import { Action } from '../low-level/action';
import { Source } from '../low-level/source';
import { TransformFactory } from '../low-level/transform';


export interface BlueprintOptions {
  path: string;
}

export class Blueprint {
  private _name: string;
  private _description: string;
  private _path: string;
  private _schema: string;
  private _source: string;
  private _transformFactory: TransformFactory | null;

  constructor(options: BlueprintOptions) {
    this.init(options);
  }

  get name() {
    return this._name;
  }

  get description() {
    return this._description;
  }

  init(options: BlueprintOptions) {
    let blueprintDefinition;
    try {
      blueprintDefinition = require(options.path);
    } catch (error) {
      throw error;
    }

    this._path = fs.lstatSync(options.path).isDirectory()
      ? options.path
      : path.dirname(options.path);
    this._name = blueprintDefinition.name;
    this._description = blueprintDefinition.description;
    this._schema = blueprintDefinition.schema;
    this._source = blueprintDefinition.source;
    this._transformFactory = blueprintDefinition.transformFactory;
  }

  load(options: any): Observable<Action> {
    // validate options
    let actions = Source(this._path, this._source);
    if (this._transformFactory) {
      actions = actions.let(this._transformFactory(options));
    }
    return actions;
  }
}
