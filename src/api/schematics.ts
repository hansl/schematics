import {Entry, Context} from '../api/entry';
import {Sink} from '../api/sink';
import {EventEmitter, EventEmitterSubject} from '../utils/private';

import 'reflect-metadata';
import {Type} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/operator/distinct';
import 'rxjs/add/operator/filter';
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

  private _beforeInstallSubject: EventEmitterSubject<void> = new EventEmitterSubject<void>();
  private _afterInstallSubject: EventEmitterSubject<void> = new EventEmitterSubject<void>();
  private _beforeWriteEntrySubject: EventEmitterSubject<Entry> = new EventEmitterSubject<Entry>();
  private _afterWriteEntrySubject: EventEmitterSubject<Entry> = new EventEmitterSubject<Entry>();
  private _beforeTransformSubject: EventEmitterSubject<Entry> = new EventEmitterSubject<Entry>();
  private _afterTransformSubject: EventEmitterSubject<Entry> = new EventEmitterSubject<Entry>();

  beforeInstall: EventEmitter<void> = this._beforeInstallSubject.asEventEmitter();
  afterInstall: EventEmitter<void> = this._afterInstallSubject.asEventEmitter();
  beforeWriteEntry: EventEmitter<Entry> = this._beforeWriteEntrySubject.asEventEmitter();
  afterWriteEntry: EventEmitter<Entry> = this._afterWriteEntrySubject.asEventEmitter();
  beforeTransformEntry: EventEmitter<Entry> = this._beforeTransformSubject.asEventEmitter();
  afterTransformEntry: EventEmitter<Entry> = this._afterTransformSubject.asEventEmitter();

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

    return this._beforeInstallSubject.emit().toPromise()
      .then(() => {
        return this.build()
          .filter(x => !!x)  // Remove nulls.
          .distinct((a, b) => {
            return (a.path == b.path && a.name == b.name);
          })
          .map(entry => {
            return this._beforeTransformSubject.emit(entry).toPromise()
              .then(() => entry.transform(this))
              .then(transformedEntry => {
                if (transformedEntry === null) {
                  return this._afterTransformSubject.emit(transformedEntry).toPromise();
                }

                return this._afterTransformSubject.emit(transformedEntry).toPromise()
                  .then(() => this._beforeWriteEntrySubject.emit(transformedEntry).toPromise())
                  .then(() => sink.write(transformedEntry))
                  .then(() => this._afterWriteEntrySubject.emit(transformedEntry).toPromise())
                  .then(() => transformedEntry);
              });
          })
          .toArray()
          .toPromise()
          .then((all) => Promise.all(all));
      })
      .then(() => {
        this._afterInstallSubject.emit();
      })
      .then(() => { sink.done(); })
      .catch((err) => sink.error(err));
  }
}
