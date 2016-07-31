import {Entry} from './entry';
import {BaseException} from './exception';
import {access, mkdir, writeFile} from './fs';
import {FileSystemException} from './source';

import fs = require('fs');
import path = require('path');

import {Observable} from 'rxjs/Observable';
import 'rxjs/add/observable/empty';
import 'rxjs/add/observable/fromPromise';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/distinct';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';


class UserCancelledSchematicOperationException extends BaseException {}


function _createParentDirectory(p: string): Promise<void> {
  return access(p, fs.W_OK)
    .catch(err => {
      switch (err.code) {
        case 'ENOENT':
          return _createParentDirectory(path.dirname(p))
            .then(() => {
              return mkdir(p)
                .catch((mkdirErr) => {
                  if (mkdirErr.code != 'EEXIST') {
                    throw new FileSystemException(mkdirErr);
                  }
                });
            });
        default:
          throw new FileSystemException(err);
      }
    });
}


function _writeSingleFile(entry: Entry, root = '') {
  const p = path.join(root, entry.path, entry.name);

  return _createParentDirectory(entry.path)
    .then(() => writeFile(p, entry.content, 'utf-8'))
    .then(() => entry);
}


function _confirmOverwriteSingleFile(entry: Entry, fn: OverwriteDoCallbackFn): Promise<Entry> {
  const p = path.join(entry.path, entry.name);

  return access(p, fs.R_OK)
    .catch(err => {
      if (err.code !== 'EEXIST') {
        // Ignore anything we don't have access to.
        return Observable.of(entry);
      }
    })
    .then(() => {
      // Confirm whether to overwrite or not. Error if the user choose to cancel the
      // blueprint.
      return Promise.resolve()
          .then(() => fn(entry))
          .then(result => {
            switch (result.action) {
              case 'cancel':    throw new UserCancelledSchematicOperationException();
              case 'ignore':    return Promise.resolve(null);
              case 'overwrite': return Promise.resolve(entry);
              case 'swap':      return Promise.resolve(result.entry);
            }
          });
    });
}


export function WriteFile(root?: string) {
  return (input: Observable<Entry>): Observable<Entry> => {
    return input
      .distinct((a, b) => a.path == b.path && a.name == b.name)
      .mergeMap(entry => Observable.fromPromise(_writeSingleFile(entry, root)));
  };
}


export function WriteMemory(map: { [key: string]: string }) {
  return (input: Observable<Entry>) => {
    return input
      .distinct((a, b) => a.path == b.path && a.name == b.name)
      .map(entry => {
        map[path.join(entry.path, entry.name)] = entry.content;
        return entry;
      });
  };
}


export type OverwriteDoCallbackReturn = {
  action: 'overwrite' | 'ignore' | 'cancel' | 'swap',
  entry?: Entry
};
export type OverwriteDoCallbackFn = (entry: Entry) => OverwriteDoCallbackReturn
                                                    | Promise<OverwriteDoCallbackReturn>;
export function OnOverwriteDo(fn: OverwriteDoCallbackFn) {
  return (input: Observable<Entry>): Observable<Entry> => {
    return input
      .distinct((a, b) => a.path == b.path && a.name == b.name)
      .mergeMap(entry => _confirmOverwriteSingleFile(entry, fn))
      .filter(entry => entry !== null);
  };
}
