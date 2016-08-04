import {WriteFile} from './sink';
import {MemorySource} from './source';

import glob = require('glob');
import mockFs = require('mock-fs');


describe('WriteFile', () => {
  beforeEach(() => mockFs());
  afterEach(() => mockFs.restore());

  it('works', (done) => {
    const map = {
      'blueprint': {
        'file': 'content',
        'dir': {
          'fn': () => 'hello world'
        }
      }
    };
    MemorySource(map)
      .let(WriteFile())
      .toPromise()
      .then(() => {
        const files = glob.sync('**', { nodir: true });
        expect(files.sort()).toEqual([
          'blueprint/dir/fn',
          'blueprint/file'
        ]);
      })
      .then(done, done.fail);
  });
});
