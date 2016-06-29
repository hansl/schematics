import * as path from 'path';

import {Context, Compiler, FileSource} from '../src';

import 'rxjs/add/operator/count';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/toPromise';


describe('FileSource', () => {
  it('can load files', (done: any) => {
    let nbCompiled = 0;
    const compiler: Compiler = {
      compile: (content: string) => {
        nbCompiled++;
        return (context: Context) => {
          return '';
        };
      }
    };

    FileSource.loadFrom(path.join(__dirname, 'template1'), compiler)
      .count()
      .toPromise()
      .then(nb => {
        expect(nb).toBe(2);
        expect(nbCompiled).toBe(nb);
      })
      .then(done, done.fail);
  });
});
