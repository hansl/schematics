import * as path from 'path';
import * as fs from 'fs';

import { BaseException } from '../exception';


export class BlueprintMetadataMustBeJsException extends BaseException { }

export interface BlueprintOptions {
  path: string;
}

export class Blueprint {
  private _name: string;
  private _description: string;
  private _path: string;
  private _schema: string;
  private _source: string;

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
    const blueprintPath = fs.lstatSync(options.path).isDirectory()
      ? path.join(options.path, 'blueprint.js')
      : options.path;

    if (!blueprintPath.endsWith('.js')) {
      throw new BlueprintMetadataMustBeJsException();
    }

    let blueprintDefinition;
    try {
      blueprintDefinition = require(blueprintPath);
    } catch (error) {
      throw new error;
    }

    this._name = blueprintDefinition.name;
    this._description = blueprintDefinition.description;
    this._path = path.dirname(blueprintPath);
    this._schema = blueprintDefinition.schema;
    this._source = blueprintDefinition.source;
  }

  load(options: any) {
    // validate options
    // load source
    // load transform
    console.log(`loading ${this.name} with ${JSON.stringify(options)}`)
  }
}
