import {FileSource} from './source';
import {
  LodashCompiler, PathRemapper, ConcatDuplicates, Splice,
  MergeJsonDuplicates
} from './transform';

import mockFs = require('mock-fs');
import path = require('path');

import 'rxjs/add/operator/let';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/merge';
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
      .let(LodashCompiler({
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

describe('ConcatDuplicates', () => {
  beforeEach(() => mockFs({
    'blueprint1': {
      'blue': {
        'file1': 'blueprint1: file1'
      }
    },
    'blueprint2': {
      'blue': {
        'file1': 'blueprint2: file1',
        'file2': 'blueprint2: file2'
      }
    },
    'blueprint3': {
      'blue': {
        'file1': 'blueprint3: file1',
        'file2': 'blueprint3: file2',
        'file3': 'blueprint3: file3'
      }
    }
  }));
  afterEach(() => mockFs.restore());

  it('works', (done) => {
    FileSource('blueprint1')
      .merge(FileSource('blueprint2'))
      .merge(FileSource('blueprint3'))
      .let(ConcatDuplicates())
      .toArray()
      .toPromise()
      .then((entries) => {
        expect(entries.length).toBe(3);
        expect(entries[0].content).toBe('blueprint1: file1blueprint2: file1blueprint3: file1');
        expect(entries[1].content).toBe('blueprint2: file2blueprint3: file2');
        expect(entries[2].content).toBe('blueprint3: file3');

        expect(entries[0].path).toBe('blue');
        expect(entries[0].name).toBe('file1');
      })
      .then(done, done.fail);
  });
});

describe('Splice', () => {
  beforeEach(() => mockFs({
    'blueprint1': {
      'blue': {
        'file1': 'blueprint1: file1'
      },
      'notConcat': 'a'
    },
    'blueprint2': {
      'blue': {
        'file1': 'blueprint2: file1',
        'file2': 'blueprint2: file2'
      },
      'notConcat': 'b'
    },
    'blueprint3': {
      'blue': {
        'file1': 'blueprint3: file1',
        'file2': 'blueprint3: file2',
        'file3': 'blueprint3: file3'
      },
      'notConcat': 'c'
    }
  }));
  afterEach(() => mockFs.restore());

  it('works', (done) => {
    FileSource('blueprint1')
      .merge(FileSource('blueprint2'))
      .merge(FileSource('blueprint3'))
      .let(Splice(e => e.path == 'blue', ConcatDuplicates()))
      .toArray()
      .toPromise()
      .then((entries) => {
        expect(entries.length).toBe(6);

        expect(entries[0].content).toBe('a');
        expect(entries[1].content).toBe('b');
        expect(entries[2].content).toBe('c');

        expect(entries[3].content).toBe('blueprint1: file1blueprint2: file1blueprint3: file1');
        expect(entries[4].content).toBe('blueprint2: file2blueprint3: file2');
        expect(entries[5].content).toBe('blueprint3: file3');
      })
      .then(done, done.fail);
  });
});

describe('MergeJsonDuplicates', () => {
  beforeEach(() => mockFs({
    'blueprint1': {
      'blue': {
        'file1': '{ "hello": "world" }',
        'file2': '{}',
        'file3': '{}'
      }
    },
    'blueprint2': {
      'blue': {
        'file1': '{ "hello": "blue" }',
        'file2': '{ "test": "test2" }'
      }
    },
    'blueprint3': {
      'blue': {
        'file1': 'NOT A JSON OBJECT'
      }
    },
    'blueprint4': {
      'blue': {
        'file1': 'NOT A JSON OBJECT'
      }
    }
  }));
  afterEach(() => mockFs.restore());

  it('works', (done) => {
    FileSource('blueprint1')
      .merge(FileSource('blueprint2'))
      .let(MergeJsonDuplicates())
      .toArray()
      .toPromise()
      .then((entries) => {
        expect(entries.length).toBe(3);
        expect(JSON.parse(entries[0].content)).toEqual({'hello': 'blue'});
        expect(JSON.parse(entries[1].content)).toEqual({'test': 'test2'});
        expect(JSON.parse(entries[2].content)).toEqual({});

        expect(entries[0].path).toBe('blue');
        expect(entries[0].name).toBe('file1');
      })
      .then(done, done.fail);
  });

  it('errors properly', (done) => {
    FileSource('blueprint3')
      .merge(FileSource('blueprint4'))
      .let(MergeJsonDuplicates())
      .toArray()
      .toPromise()
      .then(() => {
        expect(true).toBe(false);
      }, () => {})
      .then(done, done.fail);
  });
});
