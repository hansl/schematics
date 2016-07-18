import * as path from 'path';
import {Observable} from 'rxjs/Observable';

import {Entry, CompilableEntry, StaticEntry} from '../../src/api/entry';
import {Schematic, Variable} from '../../src/api/schematics';
import {SimpleSink} from '../../src/api/sink';
import {IdentityCompiler, FunctionCompiler} from '../../src/utils/compilers';
import {MemorySource, MemorySink} from '../../src/utils/memory';

import 'rxjs/add/observable/empty';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/merge';


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

  it('will remove duplicates', (done) => {
    const template1 = {
      'file1': 'some content.',
      'dir': {
        'file2': 'some other content.'
      }
    };
    const template2 = {
      'file3': 'some content.',
      'dir': {
        'file2': 'blue.'
      }
    };
    const compiler = new IdentityCompiler();

    class MySchematic extends Schematic {
      build() {
        return MemorySource.readFrom(template1, compiler)
          .merge(MemorySource.readFrom(template2, compiler));
      }
    }

    const s = new MySchematic();
    const sink = new MemorySink();
    const expected = [
      path.join('file1'),
      path.join('file3'),
      path.join('dir', 'file2')
    ];

    s.transform({});
    s.install(sink)
      .then(() => {
        const actual = sink.files;
        expect(Object.keys(actual).sort()).toEqual(expected.sort());
        // The first file should remain.
        expect(actual['dir/file2']).toBe('some other content.');
      })
      .then(done, done.fail);
  });

  it('can install', (done) => {
    const template = {
      'file1': 'some content.',
      'dir': {
        'file2': 'some other content.'
      }
    };
    const compiler = new IdentityCompiler();

    class MySchematic extends Schematic {
      build() {
        return MemorySource.readFrom(template, compiler);
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

  it('will ignore null entries', (done) => {
    const template = {
      'file1': 'some content.',
      'dir': {
        'file2': 'will be null',
        'file3': 'some other content.',
        'file4': 'will be null',
        'file5': 'some other content.'
      }
    };
    let i = 0;
    const compiler = new FunctionCompiler((e: Entry) => {
      if (i++ % 2) {
        return null;
      }
      return e;
    });

    class MySchematic extends Schematic {
      build() {
        return MemorySource.readFrom(template, compiler);
      }
    }

    const s = new MySchematic();

    const sink = new MemorySink();
    const expected = [
      path.join('file1'),
      path.join('dir', 'file3'),
      path.join('dir', 'file5')
    ];

    s.transform({});
    s.install(sink)
      .then(() => {
        const actual = sink.files;
        expect(Object.keys(actual).sort()).toEqual(expected.sort());
      })
      .then(done, done.fail);
  });

  it('will reject on sink error', (done) => {
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

  it('supports events', (done) => {
    const sink = new MemorySink();
    class MySchematic extends Schematic {
      build() {
        return Observable.of(
          new StaticEntry('', 'a', 'hello'),
          new StaticEntry('', 'b', 'world')
        );
      }
    }
    const s = new MySchematic();
    s.transform({});

    let beforeInstall = 0;
    s.beforeInstall.subscribe(() => { beforeInstall++; });
    let afterInstall = 0;
    s.afterInstall.subscribe(() => { afterInstall++; });
    let beforeTransformEntry = 0;
    s.beforeTransformEntry.subscribe(() => { beforeTransformEntry++; });
    let afterTransformEntry = 0;
    s.afterTransformEntry.subscribe(() => { afterTransformEntry++; });
    let beforeWriteEntry = 0;
    s.beforeWriteEntry.subscribe(() => { beforeWriteEntry++; });
    let afterWriteEntry = 0;
    s.afterWriteEntry.subscribe(() => { afterWriteEntry++; });

    s.install(sink)
      .then(() => {
        expect(beforeInstall).toBe(1);
        expect(afterInstall).toBe(1);
        expect(beforeTransformEntry).toBe(2);
        expect(afterTransformEntry).toBe(2);
        expect(beforeWriteEntry).toBe(2);
        expect(afterWriteEntry).toBe(2);
      })
      .then(done, done.fail);
  });
});
