// Full specs running the equivalent of a real project integration.
import * as path from 'path';
import {Observable} from 'rxjs/Observable';

import {
  mergeConcatEntry,
  Entry,
  FileSource,
  Library,
  MemorySink,
  RegisterSchematic,
  Schematic,
  Variable
} from '../../src/index';


@RegisterSchematic({
  name: 'simple'
})
class SimpleSchematic extends Schematic {
  @Variable() nb: number = 1;

  constructor(protected _fs: FileSource) {
    super();
  }

  build(): Observable<Entry> {
    const p = path.join(__dirname, '../../../tests/integration/blueprints/simple');
    return this._fs.readFrom(p);
  }
}

@RegisterSchematic({
  name: 'inherited'
})
class InheritedSchematic extends SimpleSchematic {
  @Variable() str: string = 'Hello';

  constructor(fs: FileSource) {
    super(fs);
  }

  build(): Observable<Entry> {
    const p = path.join(__dirname, '../../../tests/integration/blueprints/inherited');

    // Concat entries that have the same path from both schematics.
    return mergeConcatEntry(super.build(), this._fs.readFrom(p));
  }
}


const sink = new MemorySink();
Library.global.addProviders([FileSource]);
Library.global.setContext({ nb: 1 });
Library.global.setSink(sink);


describe('Simple', () => {
  it('works', (done) => {
    Library.global.install('simple')
      .then(() => {
        expect(Object.keys(sink.files)).toEqual(['file1']);
        expect(sink.files['file1']).toBe('\nNb: 1.  Nb+1: 2\n');
      })
      .then(done, done.fail);
  });
});

describe('Inherited', () => {
  it('works', (done) => {
    Library.global.install('inherited')
      .then(() => {
        expect(Object.keys(sink.files).sort()).toEqual(['ABCHelloDEF', 'file1', 'file2']);
        expect(sink.files['file1']).toBe('\nNb: 1.  Nb+1: 2\nother');
      })
      .then(done, done.fail);
  });
});
