import * as path from 'path';
import * as fs from 'fs';

import { BaseException } from '../exception';
import { Blueprint } from './blueprint';


export class CollectionMetadataMustBeJsonException extends BaseException { }
export class CannotLoadCollectionException extends BaseException { }
export class BlueprintNotFoundException extends BaseException { }

export interface CollectionOptions {
  path: string;
}

export class Collection {
  public name: string;
  private path: string;
  private blueprints: Blueprint[];

  constructor(options: CollectionOptions) {
    this.init(options);
  }

  init(options: CollectionOptions) {
    const metadataJsonPath = fs.lstatSync(options.path).isDirectory()
      ? path.join(options.path, 'collection.json')
      : options.path;

    if (!metadataJsonPath.endsWith('.json')) {
      throw new CollectionMetadataMustBeJsonException()
    }

    let metadataJson;
    try {
      metadataJson = require(metadataJsonPath);
    } catch (error) {
      throw new CannotLoadCollectionException();
    }

    this.path = path.dirname(metadataJsonPath);
    this.name = metadataJson.name;
    this.blueprints = metadataJson.blueprints.map((blueprintPath: string) => {
      return new Blueprint({ path: path.join(this.path, blueprintPath) });
    });
  }

  createBlueprint(name: string, options: any) {
    const blueprint = this.blueprints.find(blueprint => blueprint.name == name);
    if (!blueprint) { throw new BlueprintNotFoundException }
    return blueprint.load(options);
  }
}
