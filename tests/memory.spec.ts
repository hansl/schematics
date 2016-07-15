import * as path from 'path';

import {Context, Entry, StaticEntry} from '../src/api/entry';
import {Compiler} from '../src/api/compiler';
import {MemorySource} from '../src/utils/memory';

import 'rxjs/add/operator/count';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/toArray';
import 'rxjs/add/operator/toPromise';


describe('MemorySource', () => {
  let nbCompiled = 0;
  let nbRendered = 0;

  const compiler: Compiler = {
    compile: (entry: Entry) => {
      nbCompiled++;
      return (context: Context) => {
        nbRendered++;
        return new StaticEntry(entry.path, entry.name, '');
      };
    }
  };

  beforeEach(() => { nbCompiled = 0; });
  beforeEach(() => { nbRendered = 0; });

  it('can load files', (done: any) => {
    const ms = new MemorySource({
      'file1': 'some content.',
      'dir': {
        'file2': 'some other content.'
      }
    }, compiler);
    ms.read()
      .count()
      .toPromise()
      .then(nb => {
        expect(nb).toBe(2);
        expect(nbCompiled).toBe(nb);
      })
      .then(done, done.fail);
  });

  it('will compile', (done: any) => {
    const ms = new MemorySource({
      'file1': 'some content.',
      'dir': {
        'file2': 'some other content.'
      }
    }, compiler);

    ms.read()
      .map(entry => entry.transform({}))
      .toArray()
      .toPromise()
      .then(all => Promise.all(all))
      .then(allCompiledText => {
        allCompiledText.forEach(entry => expect(entry.content).toBe(''));
        expect(nbRendered).toBe(nbCompiled);
      })
      .then(done, done.fail);
  });

  it('conserves the path', (done: any) => {
    const expected = [
      path.join('file1'),
      path.join('dir', 'file2')
    ];

    const ms = new MemorySource({
      'file1': 'some content.',
      'dir': {
        'file2': 'some other content.'
      }
    }, compiler);

    ms.read()
      .map(entry => path.join(entry.path, entry.name))
      .toArray()
      .toPromise()
      .then(entries => {
        expect(entries).toEqual(expected);
      })
      .then(done, done.fail);
  });

  it('can call methods', (done) => {
    const ms = new MemorySource({
      'file1': (p, m) => {
        expect(m).toBe(ms);
        expect(p).toBe('file1');
        return 'hello world';
      },
      'dir': {
        'file2': (p, m) => {
          expect(m).toBe(ms);
          expect(p).toBe('dir/file2');
          return 'hello world 2';
        }
      }
    }, compiler);

    ms.read()
      .map(entry => entry.content)
      .toArray()
      .toPromise()
      .then(entries => {
        expect(entries).toEqual(['hello world', 'hello world 2']);
      })
      .then(done, done.fail);
  });

  it('will propagate errors', (done) => {
    const err = new Error('hello world');
    MemorySource.loadFrom({ 'file1': () => { throw err; } }, compiler)
      .toPromise()
      .then(() => done.fail(), (e) => {
        expect(e).toBe(err);
      })
      .then(done, done.fail);
  });
});
