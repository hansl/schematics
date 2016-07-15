// Full specs running the equivalent of a real project integration.
import * as fs from 'fs';
import * as glob from 'glob';
import * as path from 'path';
import {Observable} from 'rxjs/Observable';

import {
  Compiler,
  Entry,
  FileSink,
  FileSource,
  Library,
  RegisterSchematic,
  Schematic,
  Variable
} from '../../src/index';


@RegisterSchematic({
  name: 'simple'
})
class SimpleSchematic extends Schematic {
  @Variable() nb: number = 1;

  constructor(private _compiler: Compiler) {
    super();
  }

  build(): Observable<Entry> {
    const p = path.join(__dirname, '../../../tests/integration/blueprints/simple');
    return FileSource.readFrom(p, this._compiler);
  }
}


Library.global.setContext({ nb: 1 });
Library.global.setSink(new FileSink(path.join(__dirname, 'output')));


describe('Full Integration', () => {
  it('works', (done) => {
    Library.global.install('simple')
      .then(() => {
        const files = glob.sync(path.join(__dirname, 'output/**/*'));
        expect(files).toEqual([
          path.join(__dirname, 'output/file1')
        ]);

        expect(fs.readFileSync(path.join(__dirname, 'output/file1'), 'utf-8'))
          .toBe('\nNb: 1.  Nb+1: 2\n');
      })
      .then(done, done.fail);
  });
});
