import fs = require('fs');
import path = require('path');
import {Observable} from 'rxjs/Observable';
import {ReplaySubject} from 'rxjs/ReplaySubject';
import {Subject} from 'rxjs/Subject';

import {Entry, StaticEntry} from './entry';
import {BaseException} from '../exception';
import {access, readFile, readdir, stat} from './fs';

import 'rxjs/add/operator/toPromise';


export class SourceRootMustBeDirectoryException extends BaseException {}

export class FileSystemException extends BaseException {
  constructor(public internalError: NodeJS.ErrnoException) {
    super();
  }

  get code(): string { return this.internalError.code; }
  get message(): string { return this.internalError.message; }
}


function _recursiveFileSource(p: string, root: string): Observable<Entry> {
  const subject = new ReplaySubject();

  access(p, fs.R_OK)
    .then(() => stat(p))
    .catch(err => { throw new FileSystemException(err); })
    .then((stats) => {
      if (stats.isFile()) {
        if (p == root) {
          // Root is a file. Error.
          throw new SourceRootMustBeDirectoryException();
        }
        return readFile(p, 'utf-8')
          .then((data) => {
            const subpath = path.relative(root, p);
            subject.next(new StaticEntry(path.dirname(subpath), path.basename(subpath), data));
          });
      } else {
        return readdir(p)
          .then((files) => {
            return Promise.all(files.map((file) => {
              return _recursiveFileSource(path.join(p, file), root)
                .forEach((value) => {
                  if (value) {
                    subject.next(value);
                  }
                });
            }));
          });
      }
    })
    .then(() => subject.complete())
    .catch((err) => subject.error(err));

  return subject.asObservable();
}


export function FileSource(root: string): Observable<Entry> {
  return _recursiveFileSource(root, root);
}


export type MemoryMap = {
  [key: string]: string | MemoryMap | ((p?: string) => (string | MemoryMap))
};


function _recursiveMemorySource(subject: Subject<Entry>, map: MemoryMap, p: string) {
  for (const key of Object.keys(map)) {
    const value = map[key];
    if (typeof value == 'string') {
      subject.next(new StaticEntry(p, key, value));
    } else if (typeof value == 'function') {
      const result = value(key);
      if (typeof result == 'string') {
        subject.next(new StaticEntry(p, key, result));
      } else {
        _recursiveMemorySource(subject, result, path.join(p, key));
      }
    } else {
      _recursiveMemorySource(subject, value, path.join(p, key));
    }
  }
}


export function MemorySource(map: MemoryMap) {
  const subject = new ReplaySubject();
  try {
    _recursiveMemorySource(subject, map, '');
    subject.complete();
  } catch (err) {
    subject.error(err);
  }
  return subject.asObservable();
}
