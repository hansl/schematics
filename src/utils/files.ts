import * as fs from 'fs';
import * as path from 'path';

import {Observable} from 'rxjs/Observable';
import {Subject} from 'rxjs/Subject';

import {Compiler, CompiledFn} from '../api/compiler';
import {Entry, Context} from '../api/entry';
import {SimpleSink} from '../api/sink';
import {Source} from '../api/source';
import {promisify} from '../utils/promisify';

import 'rxjs/add/observable/empty';
import 'rxjs/add/observable/from';
import 'rxjs/add/observable/fromPromise';


const readDir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);


class FileSourceEntry implements Entry {
  private _template: string = null;
  private _compiled: Promise<CompiledFn> | CompiledFn;

  constructor(private _name: string, private _path: string, private _compiler: Compiler) {
    this._path = _path || '/'
  }

  get name(): string { return this._name; }
  get path(): string { return this._path; }

  get template(): string {
    return this._template;
  }
  set template(v: string) {
    this._template = v;
    if (v !== null) {
      this._compiled = this._compiler.compile(this._template);
    } else {
      this._compiled = null;
    }
  }

  scaffold(context?: Context): Promise<string> {
    return Promise.resolve()
      .then(() => this._compiled)
      .then(compiler => compiler ? compiler(context || {}) : null);
  }

  /**
   * Asynchronously create a file and return its entry.
   * @param p The full path of the file to create.
   * @param entryPath The path of the entry.
   * @returns A promise of the entry.
   */
  static create(p: string, entryPath: string = p, compiler: Compiler): Promise<Entry> {
    return new Promise((resolve, reject) => {
      const entry = new FileSourceEntry(path.basename(entryPath),
                                        path.dirname(entryPath),
                                        compiler);
      fs.readFile(p, 'utf-8', (err, content) => {
        if (err) {
          reject(err);
        } else {
          entry.template = content;
          resolve(entry);
        }
      });
    });
  }
}


export class FileSource implements Source {
  constructor(private _path: string, private _compiler: Compiler) {}

  private _loadFrom(root: string, p: string): Observable<Entry> {
    const fullPath = path.join(root, p);

    var stat = fs.statSync(fullPath);
    if (!stat) {
      return Observable.empty();
    }
    if (!stat.isDirectory()) {
      return Observable.fromPromise(FileSourceEntry.create(fullPath, p, this._compiler));
    }

    const s = new Subject<Entry>();
    readDir(fullPath).then((files: string[]) => {
      const children: Promise<void>[] = [];
      files.forEach((name: string) => {
        const p2 = path.join(p, name);
        children.push(this._loadFrom(root, p2).forEach(entry => s.next(entry)));
      });

      // Complete the current subject once every children is done.
      Promise.all(children).then(() => s.complete()).catch((err) => {
        debugger;
        s.error(err)
      });
    }, (err: Error) => {
      s.error(err);
    });
    return s.asObservable();
  }

  read(): Observable<Entry> {
    // We need to verify once if it's a file that we're importing.
    var stat = fs.statSync(this._path);
    if (!stat) {
      return Observable.empty();
    }
    if (!stat.isDirectory()) {
      const promise = FileSourceEntry.create(this._path, path.basename(this._path), this._compiler);
      return Observable.fromPromise(promise);
    }

    return this._loadFrom(this._path, '');
  }

  static loadFrom(p: string, compiler: Compiler): Observable<Entry> {
    return (new this(p, compiler)).read();
  }
}


export class FileSink extends SimpleSink {
  write(fileName: string, content: string): Promise<void> {
    return writeFile(fileName, content, 'utf-8');
  }
}
