# Schematics

An elegant, powerful blueprints scaffold library, using RxJS and TypeScript.

## Usage



## Example

#### Basic example using strings
```typescript
import {StringSource, Schematics, Variable} from 'schematics';
import {Observable} from 'rxjs/Observable';

export class MyExampleSchematics extends Schematics {
  @Variable() public userName: string = 'Roger';

  build(): Observable<Entry> {
    return StringSource.create({
      '/test.txt': 'Roger <%- userName %>'
    });
  }
}
```

#### Basic example using functions
```typescript
import {FunctionSource, Schematics, Variable} from 'schematics';
import {Observable} from 'rxjs/Observable';

export class MyExampleFunctionSchematics extends Schematics {
  @Variable() public value: Number = 3;

  build(): Observable<Entry> {
    return FunctionSource.create({
      '/test2.txt': (obj) => {
        if (typeof obj.value == 'number') {
          return 'Showing a number: ' + obj.value;
        } else {
          return 'This should not happen in TypeScript -_-';
        }
      }
    });
  }
}
```

#### Using multiple schematics
```typescript
import {MyExampleStringSchematics} from './example1';
import {MyExampleFunctionSchematics} from './example2';
import {Observable} from 'rxjs/Observable';

class MyExample extends Schematic {
  @Variable() public special: string = '';

  constructor(private _s1: MyExampleStringSchematics,
              private _s2: MyExampleFunctionSchematics)  {}

  build(): Observable<Entry> {
    return this._s1.build().merge(this._s2.build());
  }

  variables(): Observable<Variable> {
    return this._s1.variables()
      .merge(this._s2.variables())
      .merge(super.variables());
  }
}
```