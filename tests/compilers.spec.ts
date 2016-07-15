import {LodashTemplateCompiler, PathChangeCompiler, defaultCompiler} from '../src/utils/compilers';
import {MemorySource, MemorySink} from '../src/utils/memory';
import {Schematic, Variable} from '../src/api/schematics';


describe('LodashTemplateCompiler', () => {
  it('works', (done) => {
    const compiler = new LodashTemplateCompiler();
    const ms = new MemorySource({
      'file': 'hello <%- name %>.'
    }, compiler);
    const sink = new MemorySink();

    class MySchematics extends Schematic {
      @Variable() name: string;
      build() { return ms.read(); }
    }

    new MySchematics().transform({name: 'world'}).install(sink)
      .then(() => {
        expect(sink.files['file']).toBe('hello world.');
      })
      .then(done, done.fail);
  });
});


describe('PathChangeCompiler', () => {
  it('works', (done) => {
    const compiler = new PathChangeCompiler();
    const ms = new MemorySource({
      'path/__name__/file': 'hello <%- name %>.'
    }, compiler);
    const sink = new MemorySink();

    class MySchematics extends Schematic {
      @Variable() name: string;
      build() { return ms.read(); }
    }

    new MySchematics().transform({name: 'world'}).install(sink)
      .then(() => {
        expect(sink.files['path/world/file']).toBe('hello <%- name %>.');
      })
      .then(done, done.fail);
  });

  it('can have a custom token', (done) => {
    const compiler = new PathChangeCompiler(/\$\$(.*?)\$\$/g);
    const ms = new MemorySource({
      'path/$$name$$/file': 'hello <%- name %>.',
      'path/__name__/file': 'hello too.'
    }, compiler);
    const sink = new MemorySink();

    class MySchematics extends Schematic {
      @Variable() name: string;
      build() { return ms.read(); }
    }

    new MySchematics().transform({name: 'world'}).install(sink)
      .then(() => {
        expect(sink.files['path/world/file']).toBe('hello <%- name %>.');
        expect(sink.files['path/__name__/file']).toBe('hello too.');
      })
      .then(done, done.fail);
  });
});


describe('defaultCompiler', () => {
  it('works', (done) => {
    const compiler = defaultCompiler;
    const ms = new MemorySource({
      'path/__name__/file': 'hello <%- name %>.'
    }, compiler);
    const sink = new MemorySink();

    class MySchematics extends Schematic {
      @Variable() name: string;
      build() { return ms.read(); }
    }

    new MySchematics().transform({name: 'world'}).install(sink)
      .then(() => {
        expect(Object.keys(sink.files)).toEqual([
          'path/world/file'
        ]);
        expect(sink.files['path/world/file']).toBe('hello world.');
      })
      .then(done, done.fail);
  });
});
