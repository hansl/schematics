import * as path from 'path';
import * as fs from 'fs';

import { BaseException } from '../exception';


export class CollectionMetadataMustBeJsonException extends BaseException { }
export class CannotLoadCollectionException extends BaseException { }

export interface CollectionOptions {
  path: string;
}

export class Collection {
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

    console.log(metadataJson);
  }
}
