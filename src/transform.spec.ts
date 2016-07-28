import {FileSource} from './source';
import {LodashCompile, PathRemapper} from './transform';

import mockFs = require('mock-fs');
import path = require('path');

import 'rxjs/add/operator/let';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/toArray';
import 'rxjs/add/operator/toPromise';


describe('LodashCompiler', () => {
  beforeEach(() => mockFs({
    'blueprint1': {
      'file1': 'hello <%= str %>',
      'file2': 'number: <%= nb * 2 %>',
    }
  }));
  afterEach(() => mockFs.restore());

  it('works', (done) => {
    FileSource('blueprint1')
      .let(LodashCompile({
        str: 'world',
        nb: 4
      }))
      .toArray()
      .toPromise()
      .then((entries) => {
        expect(entries[0].content).toBe('hello world');
        expect(entries[1].content).toBe('number: 8');
      })
      .then(done, done.fail);
  });
});


describe('PathRemapper', () => {
  beforeEach(() => mockFs({
    'blueprint1': {
      '__str__': 'world',
      '__nb__': '4',
      'blue': {
        'a__str__b': {
          'c__nb__d': 'blue/aworldb/c4d'
        }
      }
    }
  }));
  afterEach(() => mockFs.restore());

  it('works', (done) => {
    FileSource('blueprint1')
      .let(PathRemapper({
        str: 'world',
        nb: 4
      }))
      .toArray()
      .toPromise()
      .then((entries) => {
        for (const entry of entries) {
          expect(path.join(entry.path, entry.name)).toBe(entry.content);
        }
      })
      .then(done, done.fail);
  });
});

