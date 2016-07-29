import fs = require('fs');
import path = require('path');

import {Entry} from './entry';
import {access, mkdir, writeFile} from './fs';
import {FileSystemException} from './source';

import {Observable} from 'rxjs/Observable';
import 'rxjs/add/observable/fromPromise';
import 'rxjs/add/operator/distinct';


function _createParentDirectory(p: string): Promise<void> {
  return access(p, fs.W_OK)
    .catch(err => {
      switch (err.code) {
        case 'ENOENT':
          return _createParentDirectory(path.dirname(p))
            .then(() => {
              return mkdir(p)
                .catch((err) => {
                  if (err.code != 'EEXIST') {
                    throw new FileSystemException(err);
                  }
                });
            });
        default:
          throw new FileSystemException(err);
      }
    });
}


function _writeSingleFile(entry: Entry): Promise<void> {
  return _createParentDirectory(entry.path)
    .then(() => writeFile(path.join(entry.path, entry.name), entry.content, 'utf-8'));
}


export function FileSink(root: string, options?: {}) {
  return (input: Observable<Entry>): Observable<void> => {
    return Observable.fromPromise(
      input.distinct((a, b) => a.path == b.path && a.name == b.name)
        .map(entry => _writeSingleFile(entry))
        .toArray()
        .toPromise()
        .then(all => Promise.all(all))
        .then(() => {})
    );
  };
}
