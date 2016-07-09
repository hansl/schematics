import * as path from 'path';

import {Inject} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {ReplaySubject} from 'rxjs/ReplaySubject';

import {Compiler} from '../api/compiler';
import {Entry, CompilableEntry} from '../api/entry';
import {Source} from '../api/source';
import {SimpleSink} from '../api/sink';


export type MemorySourceFn = (p: string, s: MemorySource) => string;
export type MemorySourceMap = {[path: string]: MemorySourceMap | MemorySourceFn | string};
export const MEMORY_SOURCE_MAP_TOKEN = Symbol();


export class MemorySource extends Source {
  constructor(@Inject(MEMORY_SOURCE_MAP_TOKEN) private _map: MemorySourceMap,
              @Inject(Compiler) private _compiler: Compiler) {
    super();
  }

  private _recursivelyRead(s: ReplaySubject<Entry>, parentPath: string, map: MemorySourceMap) {
    for (const p of Object.keys(map)) {
      const value = map[p];

      const name = path.basename(p);
      const dir = path.join(parentPath, path.dirname(p));

      if (typeof value == 'function') {
        const entry = new CompilableEntry(dir, name, this._compiler);
        entry.template = value(p, this);
        s.next(entry);
      } else if (typeof value == 'string') {
        const entry = new CompilableEntry(dir, name, this._compiler);
        entry.template = value;
        s.next(entry);
      } else {
        this._recursivelyRead(s, path.join(parentPath, p), value);
      }
    }
  }

  read(): Observable<Entry> {
    const s = new ReplaySubject<Entry>();
    try {
      this._recursivelyRead(s, '', this._map);
    } catch (err) {
      s.error(err);
    }
    s.complete();
    return s;
  }

  static loadFrom(map: MemorySourceMap, compiler: Compiler): Observable<Entry> {
    return new this(map, compiler).read();
  }
}


export class MemorySink extends SimpleSink {
  private _files: { [path: string]: string } = {};

  get files() { return this._files; }

  write(entry: Entry): Promise<void> | void {
    this._files[path.join(entry.path, entry.name)] = entry.content;
  }
}
