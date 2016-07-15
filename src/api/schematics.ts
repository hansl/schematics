import {Entry, Context} from './entry';
import {Sink} from '../api/sink';

import 'reflect-metadata';
import {Type} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {Subject} from 'rxjs/Subject';
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
  abstract build(): Observable<Entry>;

  private readonly __variables: { [name: string]: Type };

  private _beforeInstallSubject: Subject<void> = new Subject<void>();
  private _afterInstallSubject: Subject<void> = new Subject<void>();
  private _beforeWriteEntrySubject: Subject<Entry> = new Subject<Entry>();
  private _afterWriteEntrySubject: Subject<Entry> = new Subject<Entry>();
  private _beforeTransformSubject: Subject<Entry> = new Subject<Entry>();
  private _afterTransformSubject: Subject<Entry> = new Subject<Entry>();

  beforeInstall: Observable<void> = this._beforeInstallSubject.asObservable();
  afterInstall: Observable<void> = this._afterInstallSubject.asObservable();
  beforeWriteEntry: Observable<Entry> = this._beforeWriteEntrySubject.asObservable();
  afterWriteEntry: Observable<Entry> = this._afterWriteEntrySubject.asObservable();
  beforeTransformEntry: Observable<Entry> = this._beforeTransformSubject.asObservable();
  afterTransformEntry: Observable<Entry> = this._afterTransformSubject.asObservable();

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

    this._beforeInstallSubject.next();
    return this.build()
      .distinct((a, b) => (a.path == b.path && a.name == b.name))
      .map(entry => {
        return Promise.resolve()
          .then(() => {
            this._beforeTransformSubject.next(entry);
            return entry.transform(this);
          })
          .then(transformedEntry => {
            this._afterTransformSubject.next(transformedEntry);
            return transformedEntry;
          })
          .then(transformedEntry => {
            this._beforeWriteEntrySubject.next(transformedEntry);
            return Promise.resolve()
              .then(() => sink.write(transformedEntry))
              .then(() => {
                this._afterWriteEntrySubject.next(transformedEntry);
              })
          });
      })
      .toArray()
      .toPromise()
      .then((all) => Promise.all(all))
      .then(() => {
        this._afterInstallSubject.next();
      })
      .then(() => { sink.done(); })
      .catch((err) => sink.error(err));
  }
}
