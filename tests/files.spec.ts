import * as glob from 'glob';
import * as mockFs from 'mock-fs';
import * as path from 'path';

import {Entry, StaticEntry} from '../src/api/entry';
import {Compiler} from '../src/api/compiler';
import {IdentityCompiler} from '../src/utils/compilers';
import {
  FileSink,
  FileSource,
  SourceRootMustBeDirectoryException,
  FileSystemException
} from '../src/utils/files';

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
      return () => {
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

  it('will error if user cannot access the file', (done: any) => {
    FileSource.loadFrom(path.join('blueprints', 'template2'), compiler)
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
    FileSource.loadFrom(path.join('blueprints', 'template7'), compiler)
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
    FileSource.loadFrom(path.join('blueprints', 'template3'), compiler)
      .toArray()
      .toPromise()
      .then(() => {
        expect(false).toBe(true);
      }, (err) => {
        expect(err.code).toBe('EACCES');
      })
      .then(done, done.fail);
  });

  it('will be empty if root directory does not exist', (done: any) => {
    FileSource.loadFrom(path.join('blueprints', 'template4'), compiler)
      .toArray()
      .toPromise()
      .then(entries => {
        expect(entries).toEqual([]);
      })
      .then(done, done.fail);
  });

  it('will be a single file if the blueprint is a file', (done: any) => {
    FileSource.loadFrom(path.join('blueprints', 'template6'), compiler)
      .toArray()
      .toPromise()
      .then(() => {
        expect(false).toBe(true);
      }, (err) => {
        expect(err instanceof SourceRootMustBeDirectoryException).toBe(true);
      })
      .then(done, done.fail);
  });

  describe('createEntry', () => {
    it('will error', (done) => {
      FileSource.createEntry(path.normalize('blueprints/template2/fileNOACCESS'),
                              'a/b/c', new IdentityCompiler())
        .then(() => {
          expect(true).toBe(false);
        }, (err) => {
          expect(err instanceof FileSystemException).toBe(true);
        })
        .then(done, done.fail);

    });
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
      },
      'output-noaccess': mockFs.directory({
        mode: 0,
        items: {}
      })
    });
  });
  afterEach(() => mockFs.restore());

  it('can write files', (done: any) => {
    const compiler: Compiler = new IdentityCompiler();
    const root = path.join(process.cwd(), 'blueprints/template1');

    const expected = [
      path.join(root, 'file1'),
      path.join(root, 'dir', 'file2'),
      path.join(root, 'dir', 'dir2', 'file3'),
      path.join(root, 'dir', 'dir2', 'file4')
    ];

    const sink = new FileSink();
    sink.init();

    FileSource.loadFrom(path.join('blueprints', 'template1'), compiler)
      .map(entry => Promise.resolve(entry.transform({})).then(e => sink.write(e)))
      .toArray()
      .toPromise()
      .then(all => Promise.all(all))
      .then(() => {
        const actual = glob.sync(path.join(root, '/**/*'), { nodir: true });
        expect(actual.sort()).toEqual(expected.sort());
      })
      .then(done, done.fail);
  });

  it('will error if files already exist', (done) => {
    const root = path.join('blueprints', 'template1');
    const sink = new FileSink(root);
    sink.init();

    FileSource.loadFrom(path.join('blueprints', 'template1'), new IdentityCompiler())
      .map(entry => Promise.resolve(entry.transform({})).then(e => sink.write(e)))
      .toArray()
      .toPromise()
      .then(all => Promise.all(all))
      .then(() => done.fail, (err) => {
        expect(err instanceof FileSystemException).toBe(true);
      })
      .then(done, done.fail);
  });

  it('will error if no access', (done) => {
    const root = 'output-noaccess';
    const sink = new FileSink(root);
    sink.init();

    FileSource.loadFrom(path.join('blueprints', 'template1'), new IdentityCompiler())
      .map(entry => Promise.resolve(entry.transform({})).then(e => sink.write(e)))
      .toArray()
      .toPromise()
      .then(all => Promise.all(all))
      .then(() => done.fail, (err) => {
        expect(err instanceof FileSystemException).toBe(true);
      })
      .then(done, done.fail);
  });
});

