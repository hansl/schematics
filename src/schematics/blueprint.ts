import * as path from 'path';
import * as fs from 'fs';

import { BaseException } from '../exception';


export class BlueprintMetadataMustBeJsonException extends BaseException { }
export class CannotLoadBlueprintException extends BaseException { }

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
    const metadataJsonPath = fs.lstatSync(options.path).isDirectory()
      ? path.join(options.path, 'blueprint.json')
      : options.path;

    if (!metadataJsonPath.endsWith('.json')) {
      throw new BlueprintMetadataMustBeJsonException()
    }

    let metadataJson;
    try {
      metadataJson = require(metadataJsonPath);
    } catch (error) {
      throw new CannotLoadBlueprintException();
    }

    this.name = metadataJson.name;
    this.definition = metadataJson.definition;
    this.path = path.dirname(metadataJsonPath);
    this.schema = metadataJson.schema;
    this.source = metadataJson.source;
  }

  load(options: any) {
    // validate options
    // load source
    // load transform
    console.log(`loading ${this.name} with ${JSON.stringify(options)}`)
  }
}
