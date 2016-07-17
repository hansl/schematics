import * as fs from 'fs';
import * as path from 'path';

import {Inject, Injectable, Optional} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {ReplaySubject} from 'rxjs/ReplaySubject';

import {Compiler} from '../api/compiler';
import {Entry, CompilableEntry} from '../api/entry';
import {SimpleSink} from '../api/sink';
import {Source} from '../api/source';
import {BaseException} from '../core/exception';
import {promisify} from '../utils/private';

import 'rxjs/add/observable/empty';
import 'rxjs/add/observable/from';
import 'rxjs/add/observable/fromPromise';
import 'rxjs/add/observable/throw';
import ErrnoException = NodeJS.ErrnoException;


const readDir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const stat = promisify(fs.stat);
const writeFile = promisify(fs.writeFile);


export class FileSystemException extends BaseException {
  constructor(public internalError: ErrnoException) {
    super();
  }

  get code(): string { return this.internalError.code; }
  get message(): string { return this.internalError.message; }
}


export class SourceRootMustBeDirectoryException extends BaseException {}


@Injectable()
export class FileSource implements Source {
  private _path: string;

  constructor(@Optional() path: string,
              @Inject(Compiler) private _compiler: Compiler) {
    this._path = path || '/';
  }

  private _loadFrom(root: string, p: string): Observable<Entry> {
    const fullPath = path.join(root, p);
    let stats: fs.Stats = null;

    try {
      fs.accessSync(fullPath, fs.R_OK);
      stats = fs.statSync(fullPath);
    } catch (e) {
      return Observable.throw(new FileSystemException(e));
    }

    if (!stats.isDirectory()) {
      return Observable.fromPromise(FileSource.createEntry(fullPath, p, this._compiler));
    }

    const s = new ReplaySubject<Entry>();
    readDir(fullPath).then((files: string[]) => {
      const promises = files.map((name: string) => {
        return this._loadFrom(root, path.join(p, name)).forEach(entry => s.next(entry));
      });

      // Complete the current subject once every children is done.
      Promise.all(promises)
        .then(() => s.complete())
        .catch((err) => {
          s.error(err);
        });
    });
    return s.asObservable();
  }

  read(): Observable<Entry> {
    // We need to verify once if it's a file that we're importing.
    let stats: fs.Stats;
    try {
      fs.accessSync(this._path, fs.R_OK);
      stats = fs.statSync(this._path);
    } catch (err) {
      if (err.code == 'ENOENT') {
        return Observable.empty();
      } else {
        return Observable.throw(new FileSystemException(err));
      }
    }
    if (!stats.isDirectory()) {
      return Observable.throw(new SourceRootMustBeDirectoryException());
    }

    return this._loadFrom(this._path, '');
  }

  readFrom(p: string): Observable<Entry> {
    return (new FileSource(path.join(this._path, p), this._compiler)).read();
  }

  static readFrom(p: string, compiler: Compiler): Observable<Entry> {
    return (new this(p, compiler)).read();
  }

  /**
   * Asynchronously create a file and return its entry.
   * @param fullPath The full path of the file to create.
   * @param entryPath The path of the entry.
   * @param compiler The Compiler to use for the entry.
   * @returns A promise of the entry.
   */
  static createEntry(fullPath: string, entryPath: string, compiler: Compiler): Promise<Entry> {
    return readFile(fullPath, 'utf-8')
      .then(content => {
        const entry = new CompilableEntry(path.dirname(entryPath), path.basename(entryPath),
                                          compiler);
        entry.template = content;
        return entry;
      }, (err) => {
        throw new FileSystemException(err);
      });
  }
}


export class FileSink extends SimpleSink {
  constructor(private _root: string = process.cwd()) {
    super();
  }

  write(entry: Entry): Promise<void> {
    const dir = path.join(this._root, entry.path);

    return stat(dir)
      .catch(e => {
        if (e.code !== 'ENOENT') {
          throw e;
        }

        let currentPath = dir;
        while (currentPath) {
          try {
            fs.mkdirSync(currentPath);
          } catch (e) {
            break;
          }
          currentPath = path.dirname(currentPath);
        }
      })
      // This will error with the appropriate error if there's a permission problem.
      .then(() => writeFile(path.join(dir, entry.name), entry.content, 'utf-8'))
      .catch((err) => {
        return new FileSystemException(err);
      });
  }
}
