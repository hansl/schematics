import * as path from 'path';
import {
  mergeConcatEntry,
  Entry,
  FileSource,
  RegisterSchematic,
  Variable
} from '../../src/index';

import {Observable} from 'rxjs/Observable';
import {SimpleSchematic} from './simple';


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
