import fs = require('fs');
import path = require('path');
import { Observable } from 'rxjs/Observable';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { Subject } from 'rxjs/Subject';

import { Action, CreateAction } from './action';
import { BaseException } from '../exception';
import { access, readFile, readdir, stat } from './fs';

import 'rxjs/add/operator/toPromise';


export class SourceRootMustBeDirectoryException extends BaseException { }
export class SourceMustIncludeProtocolException extends BaseException { }
export class SourceMustIncludePathException extends BaseException { }
export class UnknownSourceProtocolException extends BaseException { }

export class FileSystemException extends BaseException {
  constructor(public internalError: NodeJS.ErrnoException) {
    super();
  }

  get code(): string { return this.internalError.code; }
  get message(): string { return this.internalError.message; }
}

function _recursiveFileSource(p: string, root: string): Observable<Action> {
  const subject = new ReplaySubject();

  access(p, fs.R_OK)
    .then(() => stat(p))
    .catch(err => { throw new FileSystemException(err); })
    .then((stats) => {
      const subpath = path.relative(root, p);
      if (stats.isFile()) {
        if (p == root) {
          // Root is a file. Error.
          throw new SourceRootMustBeDirectoryException();
        }
        return readFile(p, 'utf-8')
          .then((data) => {
            subject.next(new CreateAction(subpath, false, data));
          });
      } else {
        if (p != root) {
          // Don't create root.
          subject.next(new CreateAction(subpath, true, null));
        }
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


export function FileSource(root: string): Observable<Action> {
  return _recursiveFileSource(root, root);
}


export function Source(root: string, sourceString: string): Observable<Action> {
  const protocolRegex = /^(.*)\:\/\/(.*)/;
  const matches = sourceString.match(protocolRegex);

  if (!matches) { throw new SourceMustIncludeProtocolException(); }
  if (matches.length != 3) { throw new SourceMustIncludePathException(); }

  const [, sourceProtocol, sourcePath] = matches;

  switch (sourceProtocol) {
    case 'file': return FileSource(path.join(root, sourcePath));
    default: throw new UnknownSourceProtocolException();
  }
}