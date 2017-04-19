import * as path from 'path';
import * as fs from 'fs';

import { BaseException } from '../exception';


export class BlueprintMetadataMustBeJsException extends BaseException { }

export interface BlueprintOptions {
  path: string;
}

export class Blueprint {
  public name: string;
  public definition: string;
  private path: string;
  private schema: string;
  private source: string;

  constructor(options: BlueprintOptions) {
    this.init(options);
  }

  init(options: BlueprintOptions) {
    const blueprintPath = fs.lstatSync(options.path).isDirectory()
      ? path.join(options.path, 'blueprint.js')
      : options.path;

    if (!blueprintPath.endsWith('.js')) {
      throw new BlueprintMetadataMustBeJsException();
    }

    let blueprint;
    try {
      blueprint = require(blueprintPath);
    } catch (error) {
      throw new error;
    }

    this.name = blueprint.name;
    this.definition = blueprint.definition;
    this.path = path.dirname(blueprintPath);
    this.schema = blueprint.schema;
    this.source = blueprint.source;
  }

  load(options: any) {
    // validate options
    // load source
    // load transform
    console.log(`loading ${this.name} with ${JSON.stringify(options)}`)
  }
}
