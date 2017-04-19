import * as path from 'path';
import * as fs from 'fs';

import { BaseException } from '../exception';
import { Blueprint } from './blueprint';


export class CannotLoadCollectionException extends BaseException { }
export class BlueprintNotFoundException extends BaseException { }

export interface CollectionOptions {
  path: string;
}

export class Collection {
  private _name: string;
  private _path: string;
  private _blueprints: Blueprint[];

  constructor(options: CollectionOptions) {
    this.init(options);
  }

  get name() {
    return this._name;
  }

  get blueprints() {
    return this._blueprints;
  }

  init(options: CollectionOptions): void {
    let metadataJson;
    try {
      metadataJson = require(options.path);
    } catch (error) {
      throw new CannotLoadCollectionException();
    }

    this._path = fs.lstatSync(options.path).isDirectory()
      ? options.path
      : path.dirname(options.path);
    this._name = metadataJson.name;
    this._blueprints = metadataJson.blueprints.map((blueprintPath: string) => {
      return new Blueprint({ path: path.join(this._path, blueprintPath) });
    });
  }

  getBlueprint(name: string): Blueprint {
    const blueprint = this._blueprints.find(bp => bp.name == name);
    if (!blueprint) { throw new BlueprintNotFoundException; }
    return blueprint;
  }
}
