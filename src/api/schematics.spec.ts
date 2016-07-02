/// <reference path="../../node_modules/@types/jasmine/index.d.ts" />
import * as mockFs from 'mock-fs';
import {Observable} from 'rxjs/Observable';

import {Schematic, Variable} from './schematics';

import 'rxjs/add/observable/empty';


class EmptySchematic extends Schematic {
  build() {
    return Observable.empty();
  }
}


describe('Schematics', () => {

  it('can create schematics', () => {
    expect(() => new EmptySchematic()).not.toThrow();
  });

  it('can set a context', () => {

  })

});
