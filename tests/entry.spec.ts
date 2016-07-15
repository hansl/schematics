import {IdentityCompiler} from '../src/utils/compilers';
import {CompilableEntry, MoveEntry, TransformEntry, StaticEntry} from '../src/api/entry';


describe('CompilableEntry', () => {
  it('works', (done) => {
    const e1 = new CompilableEntry('a', 'b', new IdentityCompiler());
    expect(e1.content).toBe(null);

    const e2 = new CompilableEntry('', 'b', new IdentityCompiler());
    expect(e2.path).toBe('/');

    e1.template = 'abc';
    expect(e1.template).toBe('abc');
    Promise.resolve()
      .then(() => e1.transform())
      .then(e => expect(e.content).toBe('abc'))
      .then(done, done.fail);
  });

  it('can be set to null', () => {
    const e1 = new CompilableEntry('a', 'b', new IdentityCompiler());
    expect(e1.content).toBe(null);
    e1.template = 'hello';
    expect(e1.content).not.toBe(null);
    e1.template = null;
    expect(e1.content).toBe(null);
  });
});


describe('MoveEntry', () => {
  it('works', (done) => {
    const e1 = new CompilableEntry('', 'b', new IdentityCompiler());
    e1.template = 'abc';
    const e2 = new MoveEntry(e1, '/dir', 'file');

    expect(e2.content).toBe(e1.content);
    expect(e1.path).toBe('/');
    expect(e2.path).toBe('/dir');
    expect(e1.name).toBe('b');
    expect(e2.name).toBe('file');

    Promise.resolve()
      .then(() => e2.transform({}))
      .then(e3 => expect(e3.content).toBe('abc'))
      .then(done, done.fail);
  });
});


describe('TransformEntry', () => {
  it('works', (done) => {
    const e1 = new CompilableEntry('a', 'b', new IdentityCompiler());
    e1.template = 'abc';
    const e2 = new TransformEntry(e1, function(entry, context) {
      return new StaticEntry(e1.path, e1.name, 'hello');
    });

    expect(e1.content).toBe('abc');
    expect(e1.path).toBe('a');
    expect(e1.name).toBe('b');
    expect(e2.path).toBe('a');
    expect(e2.name).toBe('b');

    Promise.resolve()
      .then(() => e2.transform({}))
      .then(e3 => expect(e3.content).toBe('hello'))
      .then(done, done.fail);
  });
});
