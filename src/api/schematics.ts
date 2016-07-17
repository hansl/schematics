import {Entry, Context} from '../api/entry';
import {Sink} from '../api/sink';
import {EventEmitter} from '../utils/private';

import 'reflect-metadata';
import {Type} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/operator/distinct';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/toArray';
import 'rxjs/add/operator/toPromise';


export function Variable(): PropertyDecorator {
  return function(target: Object, propertyKey: string | symbol) {
    if (Object.getPrototypeOf(target)._$variables === undefined) {
      Object.getPrototypeOf(target)._$variables = Object.create(null);
    }
    Object.getPrototypeOf(target)._$variables[propertyKey] =
        Reflect.getMetadata('design:type', target, propertyKey);
  };
}


export abstract class Schematic {
  abstract build(): Observable<Entry>;

  private readonly _$variables: { [name: string]: Type };

  private _beforeInstallSubject: EventEmitter<void> = new EventEmitter<void>();
  private _afterInstallSubject: EventEmitter<void> = new EventEmitter<void>();
  private _beforeWriteEntrySubject: EventEmitter<Entry> = new EventEmitter<Entry>();
  private _afterWriteEntrySubject: EventEmitter<Entry> = new EventEmitter<Entry>();
  private _beforeTransformSubject: EventEmitter<Entry> = new EventEmitter<Entry>();
  private _afterTransformSubject: EventEmitter<Entry> = new EventEmitter<Entry>();

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
      if (proto._$variables) {
        for (const key of Object.keys(proto._$variables)) {
          names[key] = names[key] || proto._$variables[key];
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

    this._beforeInstallSubject.emit();
    return this.build()
      .distinct((a, b) => {
        return (a.path == b.path && a.name == b.name);
      })
      .map(entry => {
        return Promise.resolve()
          .then(() => {
            this._beforeTransformSubject.emit(entry);
            return entry.transform(this);
          })
          .then(transformedEntry => {
            this._afterTransformSubject.emit(transformedEntry);
            return transformedEntry;
          })
          .then(transformedEntry => {
            this._beforeWriteEntrySubject.emit(transformedEntry);
            return Promise.resolve()
              .then(() => sink.write(transformedEntry))
              .then(() => {
                this._afterWriteEntrySubject.emit(transformedEntry);
              });
          });
      })
      .toArray()
      .toPromise()
      .then((all) => Promise.all(all))
      .then(() => {
        this._afterInstallSubject.emit();
      })
      .then(() => { sink.done(); })
      .catch((err) => sink.error(err));
  }
}
