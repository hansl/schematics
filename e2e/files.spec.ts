import * as path from 'path';

import {FileSource} from '../src';


describe('FileSource', () => {
  it('can load files', (done: any) => {
    FileSource.loadFrom(path.join(__dirname, 'template1'))
      .forEach(entry => Promise.resolve()
        .then(() => entry.scaffold({
          'user': 'hans',
          'blah': 'testing',
          'functions': [
            {'name': 'test', 'log': 'rocknroll'},
            {'name': 'test2', 'log': 'another roll'}
          ]
        }))
        .then(content => {
          console.log(entry.path, entry.name, content);
        }))
      .then(done, done.fail);
  });
});
