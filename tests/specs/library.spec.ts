import 'reflect-metadata';
import {Injectable, NoProviderError, Provider, ReflectiveInjector} from '@angular/core';
import {Observable} from 'rxjs/Observable';

import {Schematic} from '../../src/api/schematics';
import {Compiler} from '../../src/api/compiler';
import {Library} from '../../src/library/library';
import {IdentityCompiler} from '../../src/utils/compilers';
import {MemorySink, MemorySource, kMemorySourceMapToken} from '../../src/utils/memory';
import {Source} from '../../src/api/source';
import {Sink} from '../../src/api/sink';


class EmptySchematic extends Schematic {
  build() {
    return Observable.empty();
  }
}


describe('Library', () => {
  it('can register and create Schematics', () => {
    const library = new Library(new IdentityCompiler());

    library.register('empty', EmptySchematic);

    const s = library.create('empty');
    expect(s instanceof Schematic).toBe(true);

    const s2 = library.create('empty', {});
    expect(s2 instanceof Schematic).toBe(true);
  });

  it('can perform the whole DI flow', (done) => {
    const library = new Library(new IdentityCompiler());
    const sink = new MemorySink();

    @Injectable()
    class SimpleSchematic extends Schematic {
      constructor(private _source: Source) {
        super();
      }
      build() {
        return this._source.read();
      }
    }

    library.addProviders([
      { provide: kMemorySourceMapToken, useValue: ({
        'file': 'hello world',
        'dir/file2': 'woot'
      }) },
      { provide: Source, useClass: MemorySource },
      { provide: Sink, useValue: sink }
    ]);

    library.register('empty', EmptySchematic);
    library.register('simple', SimpleSchematic);

    // Try to install the empty schematics.
    library.install('empty')
      .then(() => expect(sink.files).toEqual({}))
      .then(() => library.install('simple', sink))
      .then(() => {
        expect(sink.files).toEqual({
          'file': 'hello world',
          'dir/file2': 'woot'
        });
      })
      .then(done, done.fail);
  });

  it('will inherit from a parent injector', (done) => {
    const sink = new MemorySink();
    const parentInjector = ReflectiveInjector.resolveAndCreate([
      { provide: Compiler, useValue: new IdentityCompiler() },
      { provide: Source, useValue: new MemorySource({
        'file': 'hello world',
        'dir/file2': 'woot'
      }, new IdentityCompiler()) },
      { provide: Sink, useValue: sink }
    ], null);

    @Injectable()
    class SimpleSchematic extends Schematic {
      constructor(private _source: Source) {
        super();
      }
      build() {
        return this._source.read();
      }
    }

    const library = new Library(new IdentityCompiler(), parentInjector);
    library.register('empty', EmptySchematic);
    library.register('simple', SimpleSchematic);

    // Create once to create the internal injector.
    library.create('empty');
    library.install('empty')
      .then(() => expect(sink.files).toEqual({}))
      .then(() => library.install('simple', { sink }))
      .then(() => {
        expect(sink.files).toEqual({
          'file': 'hello world',
          'dir/file2': 'woot'
        });
      })
      .then(() => {
        expect(library.parentInjector).toBe(parentInjector);

        // Delete library's parent injector.
        library.parentInjector = null;
        expect(library.parentInjector).toBe(null);
        // This should fail because the Compiler isn't optional.
        return library.install('empty');
      })
      .then(() => {
        expect(false).toBe(true);
      }, (err) => {
        expect(err instanceof NoProviderError).toBe(true);
      })
      .then(() => {
        // Reinstate the same library's parent injector, this should now work
        // as expected.
        library.parentInjector = parentInjector;
        return library.install('empty');
      })
      .then(done, done.fail);
  });

  it('will throw on error', () => {
    const library = new Library(new IdentityCompiler());

    class OtherSchematic extends EmptySchematic {}

    library.register('empty', EmptySchematic);
    expect(() => library.register('empty', EmptySchematic)).not.toThrow();
    expect(() => library.register('empty', OtherSchematic)).toThrow();
    expect(() => library.create('unknown')).toThrow();
  });

  it('can unregister schematics', () => {
    const library = new Library(new IdentityCompiler());

    class OtherSchematic extends EmptySchematic {}

    library.register('test', EmptySchematic);
    library.register('test2', OtherSchematic);
    library.register('empty', EmptySchematic);

    expect(() => library.create('empty')).not.toThrow();
    expect(() => library.create('test')).not.toThrow();
    library.unregister(EmptySchematic);
    expect(() => library.create('empty')).toThrow();
    expect(() => library.create('test')).toThrow();
    expect(() => library.create('test2')).not.toThrow();
    library.register('empty', OtherSchematic);
    expect(() => library.create('empty')).not.toThrow();
    library.unregister('empty');
    expect(() => library.create('empty')).toThrow();
    library.unregister('empty');
    expect(() => library.create('empty')).toThrow();
  });

  it('can remove and add providers', () => {
    const library = new Library(new IdentityCompiler());
    let called = 0;

    class Type {
      constructor() { called++; }
    }

    library.addProviders([Type]);
    library.get(Type);
    expect(called).toBe(1);
    library.removeProvider(Type);
    expect(() => library.get(Type)).toThrow();
    expect(called).toBe(1);

    library.addProviders([new Provider('hello', { useClass: Type })]);
    library.get('hello');
    expect(called).toBe(2);
    library.removeProvider('hello');
    expect(() => library.get('hello')).toThrow();
    expect(called).toBe(2);

    library.addProviders([{ provide: 'hello', useClass: Type }]);
    library.get('hello');
    expect(called).toBe(3);
    library.removeProvider('hello');
    expect(() => library.get('hello')).toThrow();
    expect(called).toBe(3);
  });
});
