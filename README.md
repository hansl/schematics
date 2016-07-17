[![Build Status](https://travis-ci.org/hansl/schematics.svg?branch=master)](https://travis-ci.org/hansl/schematics) [![Coverage Status](https://coveralls.io/repos/github/hansl/schematics/badge.svg?branch=master)](https://coveralls.io/github/hansl/schematics?branch=master)


# Schematics

An elegant, powerful blueprints scaffold library, using RxJS and TypeScript.

## Usage Examples

#### Basic example using strings
```typescript
import {Compiler, MemorySource, Schematics, Variable} from 'schematics';
import {Observable} from 'rxjs/Observable';

export class MyExampleSchematics extends Schematics {
  @Variable() public userName: string = 'Roger';

  constructor(private _compiler: Compiler) {
    super();
  }

  build(): Observable<Entry> {
    return MemorySource.readFrom({
      '/test.txt': 'Roger <%- userName %>'
    }, this._compiler);
  }
}
```

#### Basic example using functions
```typescript
import {Compiler, MemorySource, Schematics, Variable} from 'schematics';
import {Observable} from 'rxjs/Observable';

export class MyExampleFunctionSchematics extends Schematics {
  @Variable() public value: Number = 3;

  constructor(private _compiler: Compiler) {
    super();
  }

  build(): Observable<Entry> {
    return MemorySource.create({
      '/test2.txt': () => {
        if (typeof this.value == 'number') {
          return 'Showing a number: ' + this.value;
        } else {
          return 'This should not happen in TypeScript -_-';
        }
      }
    }, this._compiler);
  }
}
```

#### Using multiple schematics
```typescript
import {Context, RegisterSchematic} from 'schematics';
import {MyExampleStringSchematics} from './example1';
import {MyExampleFunctionSchematics} from './example2';
import {Observable} from 'rxjs/Observable';

// Register this schematic with the global library.
@RegisterSchematic({ name: 'Multiple' })
class MyExample extends Schematic {
  constructor(private _s1: MyExampleStringSchematics,
              private _s2: MyExampleFunctionSchematics)  {}

  build(): Observable<Entry> {
    return this._s1.build().merge(this._s2.build());
  }

  transform(context: Context) {
    super.transform(context);
    this._s1.transform(context);
    this._s2.transform(context);
  }
}
```

#### Installing a Schematic
```typescript
import {Library} from 'schematics';
// Include the module above which registers this with the main
// code.
import 'multiple';

// Declare a sink to get the output of the schematics installation.
// We're going to output this to '/tmp'. Paths are always normalized
// before being used in Schematics.
const sink = new FileSink('/tmp');

// Library.global is the global library.
Library.global.setSink(sink);  // This sets the default sink. It is possible
                               // to use multiple sinks.

// Create the context for the values to be used in the templates.
Library.global.setContext({
  userName: 'blesh',
  // Values that aren't used in schematics will, of course, be ignored.
  ignored1: 'value',
  ignored2: 1
  // Since we don't include 'value', MyExampleFunctionSchematics will use
  // its default of 3.
});

// Install it by using its name.  The install() method takes another
// argument to pass in a different sink, or a context. The two calls above
// simply set the defaults for those.
Library.global.install('Multiple');

// We're going to go a little advanced here...
sink.
```