/// <reference path="../../node_modules/@types/jasmine/index.d.ts" />
import * as mockFs from 'mock-fs';

import * as glob from 'glob';
import * as path from 'path';

import {IdentityCompiler} from '../api/compiler';
import {StaticEntry} from '../api/entry';
import {Context, Compiler, Entry} from '../index';
import {FileSink, FileSource} from './files';

import 'rxjs/add/operator/count';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/toArray';
import 'rxjs/add/operator/toPromise';


describe('FileSource', () => {
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

  beforeEach(() => {
    // Setup the file system with two non-empty files.
    mockFs({
      'blueprints/template1': {
        'file1': 'some content.',
        'dir': {
          'file2': 'some other content.'
        }
      }
    });
  });
  afterEach(() => mockFs.restore());

  it('can load files', (done: any) => {
    FileSource.loadFrom(path.join('blueprints', 'template1'), compiler)
      .count()
      .toPromise()
      .then(nb => {
        expect(nb).toBe(2);
        expect(nbCompiled).toBe(nb);
      })
      .then(done, done.fail);
  });

  it('will compile', (done: any) => {
    FileSource.loadFrom(path.join('blueprints', 'template1'), compiler)
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

    FileSource.loadFrom(path.join('blueprints', 'template1'), compiler)
      .map(entry => path.join(entry.path, entry.name))
      .toArray()
      .toPromise()
      .then(entries => {
        expect(entries).toEqual(expected);
      })
      .then(done, done.fail);
  });
});

describe('FileSink', () => {
  beforeEach(() => {
    // Setup the file system with two non-empty files.
    mockFs({
      'blueprints/template1': {
        'file1': 'some content.',
        'dir': {
          'file2': 'some other content.',
          'dir2': {
            'file3': '',
            'file4': ''
          }
        }
      }
    });
  });
  afterEach(() => mockFs.restore());

  it('can write files', (done: any) => {
    const compiler: Compiler = new IdentityCompiler();

    const root = 'output';
    const expected = [
      path.join(root, 'file1'),
      path.join(root, 'dir', 'file2'),
      path.join(root, 'dir', 'dir2', 'file3'),
      path.join(root, 'dir', 'dir2', 'file4')
    ];

    const sink = new FileSink(root);
    sink.init();

    FileSource.loadFrom(path.join('blueprints', 'template1'), compiler)
      .map(entry => Promise.resolve(entry.transform({})).then(entry => sink.write(entry)))
      .toArray()
      .toPromise()
      .then(all => Promise.all(all))
      .then(() => {
        const actual = glob.sync(path.join(root, '/**/*'), { nodir: true });
        expect(actual.sort()).toEqual(expected.sort());
      })
      .then(done, done.fail);
  });
});
