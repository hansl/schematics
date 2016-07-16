import * as path from 'path';
import {
  Entry,
  FileSource,
  RegisterSchematic,
  Schematic,
  Variable
} from '../../src/index';

import {Observable} from 'rxjs/Observable';


@RegisterSchematic({
  name: 'simple'
})
export class SimpleSchematic extends Schematic {
  @Variable() nb: number = 1;

  constructor(protected _fs: FileSource) {
    super();
  }

  build(): Observable<Entry> {
    const p = path.join(__dirname, '../../../tests/integration/blueprints/simple');
    return this._fs.readFrom(p);
  }
}
