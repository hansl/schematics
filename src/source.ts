import fs = require('fs');
import path = require('path');
import {Observable} from 'rxjs/Observable';
import {ReplaySubject} from 'rxjs/ReplaySubject';

import {Entry, StaticEntry} from './entry';
import {BaseException} from './exception';

import 'rxjs/add/operator/toPromise';


export class SourceRootMustBeDirectoryException extends BaseException {}

export class FileSystemException extends BaseException {
  constructor(public internalError: NodeJS.ErrnoException) {
    super();
  }

  get code(): string { return this.internalError.code; }
  get message(): string { return this.internalError.message; }
}


function readFile(p: string): Promise<string> {
  return new Promise((resolve, reject) => {
    fs.readFile(p, 'utf-8', (err, data) => {
      if (err) {
        reject(new FileSystemException(err));
      } else {
        resolve(data);
      }
    });
  });
}

function readdir(p: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    fs.readdir(p, (err, files) => {
      if (err) {
        reject(new FileSystemException(err));
      } else {
        resolve(files);
      }
    });
  });
}

function access(p: string, mode: number): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.access(p, mode, (err) => {
      if (err) {
        reject(new FileSystemException(err));
      } else {
        resolve();
      }
    });
  });
}

function stat(p: string): Promise<fs.Stats> {
  return new Promise((resolve, reject) => {
    fs.stat(p, (err, stats) => {
      if (err) {
        reject(new FileSystemException(err));
      } else {
        resolve(stats);
      }
    });
  });
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
        return readFile(p)
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

