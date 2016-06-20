import {Observable} from 'rxjs/Observable';
import {Entry, Context} from './entry';

import 'reflect-metadata';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/toArray';
import 'rxjs/add/operator/toPromise';
import {Type} from '@angular/core';


export function Variable(): PropertyDecorator {
  return function(target: Object, propertyKey: string | symbol) {
    Object.getPrototypeOf(target).__variables[propertyKey] =
        Reflect.getMetadata("design:type", target, propertyKey);
  };
}


export abstract class Schematic {
  private readonly __variables: { [name: string]: Type };

  abstract build(): Observable<Entry>;

  transform(context: Context) {
    for (const key of Object.keys(this.__variables)) {
      console.log(key);
    }
  }
}
