import * as path from 'path';
import {Observable} from 'rxjs/Observable';

import {Entry, CompilableEntry} from '../src/api/entry';
import {Schematic, Variable} from '../src/api/schematics';
import {SimpleSink} from '../src/api/sink';
import {IdentityCompiler} from '../src/utils/compilers';
import {MemorySource, MemorySink} from '../src/utils/memory';

import 'rxjs/add/observable/empty';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/distinct';


class EmptySchematic extends Schematic {
  build(): Observable<Entry> {
    return Observable.empty();
  }
}

class ErrorSink extends SimpleSink {
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
    const template = {
      'file1': 'some content.',
      'dir': {
        'file2': 'some other content.'
      }
    };
    const compiler = new IdentityCompiler();

    class MySchematic extends Schematic {
      build() {
        return MemorySource.loadFrom(template, compiler);
      }
    }

    const s = new MySchematic();

    const sink = new MemorySink();
    const expected = [
      path.join('file1'),
      path.join('dir', 'file2')
    ];

    s.transform({});
    s.install(sink)
      .then(() => {
        const actual = sink.files;
        expect(Object.keys(actual).sort()).toEqual(expected.sort());
      })
      .then(done, done.fail);
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
