import {FileSource, SourceRootMustBeDirectoryException} from './source';
import mockFs = require('mock-fs');
import path = require('path');

import 'rxjs/add/operator/map';
import 'rxjs/add/operator/toArray';
import 'rxjs/add/operator/toPromise';


describe('FileSource', () => {
  beforeEach(() => mockFs({
    'deep/path/to/blueprint1': {
      'file1': 'file1',
      'file2': 'file2',
      'dir1': {
        'file3': 'dir1/file3',
        'dir2': {
          'file4': 'dir1/dir2/file4'
        },
        'file5': 'dir1/file5'
      },
      'dir3': {}
    },
    'blueprints/template2': {
      'file1': 'some content.',
      'fileNOACCESS': mockFs.file({
        mode: 0,
        content: 'NO ACCESS'
      })
    },
    'blueprints/template3': mockFs.directory({
      mode: 0,
      items: {}
    }),
    // template4 doesn't exist.
    'blueprints/template5': {
      'file1': 'some content.',
      'fileNOACCESS': mockFs.file({
        mode: 0,
        content: 'NO ACCESS'
      })
    },
    'blueprints/template6': mockFs.file({ content: 'hello world' }),
    'blueprints/template7': {
      'file1': 'some content.',
      'dir': {
        'fileNOACCESS': mockFs.file({
          mode: 0,
          content: 'NO ACCESS'
        })
      }
    },
  }));
  afterEach(() => mockFs.restore());

  it('works', (done) => {
    FileSource('deep/path/to/blueprint1')
      .toArray()
      .toPromise()
      .then((entries) => {
        expect(entries.length).toBe(5);
        for (const entry of entries) {
          expect(entry.content).toBe(path.join(entry.path, entry.name));
        }
      })
      .then(done, done.fail);
  });

  it('will error if user cannot access the file', (done: any) => {
    FileSource(path.join('blueprints', 'template2'))
      .map(entry => path.join(entry.path, entry.name))
      .toArray()
      .toPromise()
      .then(() => {
        expect(false).toBe(true);
      }, (err) => {
        expect(err.code).toBe('EACCES');
      })
      .then(done, done.fail);
  });

  it('will error if user cannot access the file (deep)', (done: any) => {
    FileSource(path.join('blueprints', 'template7'))
      .map(entry => path.join(entry.path, entry.name))
      .toArray()
      .toPromise()
      .then(() => {
        expect(false).toBe(true);
      }, (err) => {
        expect(err.code).toBe('EACCES');
      })
      .then(done, done.fail);
  });

  it('will error if user cannot access the root directory', (done: any) => {
    FileSource(path.join('blueprints', 'template3'))
      .toArray()
      .toPromise()
      .then(() => {
        expect(false).toBe(true);
      }, (err) => {
        expect(err.code).toBe('EACCES');
      })
      .then(done, done.fail);
  });

  it('will error if root directory does not exist', (done: any) => {
    FileSource(path.join('blueprints', 'template4'))
      .toArray()
      .toPromise()
      .then(() => {
        expect(false).toBe(true);
      }, (err) => {
        expect(err.code).toBe('ENOENT');
      })
      .then(done, done.fail);
  });

  it('will error if the blueprint is a file', (done: any) => {
    FileSource(path.join('blueprints', 'template6'))
      .toArray()
      .toPromise()
      .then(() => {
        expect(false).toBe(true);
      }, (err) => {
        expect(err instanceof SourceRootMustBeDirectoryException).toBe(true);
      })
      .then(done, done.fail);
  });
});
