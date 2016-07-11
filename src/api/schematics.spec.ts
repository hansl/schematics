/// <reference path="../../node_modules/@types/jasmine/index.d.ts" />
import * as glob from 'glob';
import * as mockFs from 'mock-fs';
import * as path from 'path';
import {Observable} from 'rxjs/Observable';

import {IdentityCompiler} from './compiler';
import {Entry, CompilableEntry} from './entry';
import {Schematic, Variable} from './schematics';
import {SimpleSink} from './sink';
import {FileSource, FileSink} from '../utils/files';

import 'rxjs/add/observable/empty';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/distinct';


class EmptySchematic extends Schematic {
  build(): Observable<Entry> {
    return Observable.empty();
  }
}

class ErrorSink extends SimpleSink {
  constructor(private _nb: number = 0) {
    super();
  }

  write(entry: Entry): Promise<void> {
    return Promise.reject(new Error('reason'));
  }
}


describe('Schematics', () => {
  it('can create schematics', () => {
    expect(() => new EmptySchematic()).not.toThrow();
  });

  it('can chain transforms', () => {
    const s = new EmptySchematic();
    expect(s.transform({})).toBe(s);
  });

  it('can transform using a context', () => {
    let called = false;
    class MySchematic extends EmptySchematic {
      @Variable() test: Number = 1;

      get myVar(): string {
        return null;
      }
      @Variable() set myVar(value: string) {
        called = true;
      }
    }

    const s = new MySchematic();
    s.transform({
      myVar: 123
    });

    expect(called).toBe(true);
    expect(s.test).toBe(1);

    s.transform({
      test: 2
    });
    expect(s.test).toBe(2);
  });

  it('can install', (done) => {
    // Setup the file system with two non-empty files.
    // We don't use a compiler, compilers are tested elsewhere.
    mockFs({
      'blueprints/template1': {
        'file1': 'some content.',
        'dir': {
          'file2': 'some other content.'
        }
      }
    });
    const compiler = new IdentityCompiler();

    class MySchematic extends Schematic {
      build() {
        const fs = new FileSource('blueprints/template1', compiler);
        return fs.read();
      }
    }

    const s = new MySchematic();

    const root = 'output';
    const sink = new FileSink(root);
    const expected = [
      path.join(root, 'file1'),
      path.join(root, 'dir', 'file2')
    ];

    s.transform({});
    s.install(sink)
      .then(() => {
        const actual = glob.sync(path.join(root, '/**/*'), { nodir: true });
        expect(actual.sort()).toEqual(expected.sort());
      })
      .then(() => {
        mockFs.restore();
        done();
      }, () => {
        mockFs.restore();
        done.fail();
      });
  });

  it('will reject on error', (done) => {
    const sink = new ErrorSink();
    class MySchematic extends Schematic {
      build() {
        return Observable.of(new CompilableEntry('', 'a', new IdentityCompiler()));
      }
    }
    const s = new MySchematic();
    s.transform({});
    s.install(sink)
      .then(() => done.fail(), (err) => {
        expect(err.message).toBe('reason');
        done();
      });
  });
});
