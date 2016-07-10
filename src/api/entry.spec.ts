/// <reference path="../../node_modules/@types/jasmine/index.d.ts" />
import {IdentityCompiler} from './compiler';
import {CompilableEntry, MoveEntry} from './entry';


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
});


describe('MoveEntry', () => {
  it('works', () => {
    const e1 = new CompilableEntry('', 'b', new IdentityCompiler());
    e1.template = 'abc';
    const e2 = new MoveEntry(e1, '/dir', 'file');

    expect(e2.content).toBe(e1.content);
    expect(e1.path).toBe('/');
    expect(e2.path).toBe('/dir');
    expect(e1.name).toBe('b');
    expect(e2.name).toBe('file');
  });
});
