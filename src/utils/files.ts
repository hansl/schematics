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
const stat = promisify(fs.stat);
const writeFile = promisify(fs.writeFile);


class FileSourceEntry implements Entry {
  private _template: string = null;
  private _compiled: Promise<CompiledFn> | CompiledFn;

  constructor(private _name: string, private _path: string, private _compiler: Compiler) {
    this._path = _path || '/'
  }

  get name(): string { return this._name; }
  get path(): string { return this._path; }
  get content(): string { return this._template; }

  get template(): string {
    return this._template;
  }
  set template(v: string) {
    this._template = v;
    if (v !== null) {
      this._compiled = this._compiler.compile(this);
    } else {
      this._compiled = null;
    }
  }

  transform(context?: Context): Promise<Entry> {
    return Promise.resolve()
      .then(() => this._compiled)
      .then(compiler => compiler ? compiler(context || {}) : null);
  }

  /**
   * Asynchronously create a file and return its entry.
   * @param p The full path of the file to create.
   * @param entryPath The path of the entry.
   * @param compiler The Compiler to use for the entry.
   * @returns A promise of the entry.
   */
  static create(p: string, entryPath: string = p, compiler: Compiler): Promise<Entry> {
    return readFile(p, 'utf-8')
      .then(content => {
        const entry = new FileSourceEntry(path.basename(entryPath),
                                          path.dirname(entryPath),
                                          compiler);
        entry.template = content;
        return entry;
      });
  }
}


export class FileSource implements Source {
  constructor(private _path: string, private _compiler: Compiler) {}

  private _loadFrom(root: string, p: string): Observable<Entry> {
    const fullPath = path.join(root, p);
    let stat: fs.Stats = null;

    try {
      stat = fs.statSync(fullPath);
    } catch (e) {
      if (e.code !== 'ENOENT') {
        return Observable.throw(e);
      } else {
        return Observable.empty();
      }
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

        let p = '';
        const dirFragment = dir.split(path.sep);
        for (const current of dirFragment) {
          const currentPath = path.join(p, current);
          try {
            fs.mkdirSync(currentPath);
          } catch (e) {
            if (e.code !== 'EEXIST') {
              throw e;
            }
          }
          p = currentPath;
        }
      })
      // This will error with the appropriate error if there's a permission problem.
      .then(() => writeFile(path.join(dir, entry.name), entry.content, 'utf-8'));
  }
}
