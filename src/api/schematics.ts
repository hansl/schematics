import {Type} from '@angular/core';
import {Observable} from 'rxjs/Observable';

import {Entry, Context} from './entry';
import {Sink} from '../api/sink';

import 'reflect-metadata';
import 'rxjs/add/operator/distinct';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/toArray';
import 'rxjs/add/operator/toPromise';


export function Variable(): PropertyDecorator {
  return function(target: Object, propertyKey: string | symbol) {
    if (Object.getPrototypeOf(target).__variables === undefined) {
      Object.getPrototypeOf(target).__variables = Object.create(null);
    }
    Object.getPrototypeOf(target).__variables[propertyKey] =
        Reflect.getMetadata("design:type", target, propertyKey);
  };
}


export abstract class Schematic {
  private readonly __variables: { [name: string]: Type };

  abstract build(): Observable<Entry>;

  transform(context: Context): this {
    // Collect all the variables from all the parent prototypes.
    let names: { [name: string]: Type } = Object.create(null);
    for (let proto = this; proto; proto = Object.getPrototypeOf(proto)) {
      if (proto.__variables) {
        for (const key of Object.keys(proto.__variables)) {
          names[key] = names[key] || proto.__variables[key];
        }
      }
    }

    for (const key of Object.keys(names)) {
      // Perform a conversion.
      if (context.hasOwnProperty(key)) {
        (<any>this)[key] = (names[key])(context[key]);
      }
    }

    return this;
  }

  install(sink: Sink): Promise<void> {
    sink.init();

    return this.build()
      .distinct((a, b) => {
        return (a.path == b.path && a.name == b.name);
      })
      .map(entry => {
        return Promise.resolve()
          .then(() => entry.transform(this))
          .then(entry => sink.write(entry));
      })
      .toArray()
      .toPromise()
      .then((all) => Promise.all(all))
      .then(() => { sink.done(); }, (err) => sink.error(err));
  }
}
