import {Injector, Provider, ReflectiveInjector, Type} from '@angular/core';

import {Schematic} from '../api/schematics';
import {BaseException} from '../core/exception';
import {Compiler} from '../api/compiler';
import {Source} from '../api/source';
import {Sink} from '../api/sink';


export class SchematicAlreadyRegistered extends BaseException {}
export class SchematicUnknown extends BaseException {}


export type Providers = Array<Type | Provider | { [k: string]: any; } | any[]>;


export interface SchematicType<T extends Schematic> {
  new (...args: any[]): T;
}


export class Library {
  private _injector: Injector = null;
  private _providers: Providers;
  private _registry: { [name: string]: any } = Object.create(null);

  constructor(private _compiler: Compiler, private _parentInjector: Injector = null) {
    this._providers = [{ provide: Compiler, useValue: _compiler }];
  }

  private _createInjector() {
    this._injector = ReflectiveInjector.resolveAndCreate(this._providers, this._parentInjector);
  }

  addProviders(providers: Providers) {
    this._providers = this._providers.concat(providers);
    this._injector = null;
  }

  register<U extends Schematic>(name: string, schematic: SchematicType<U>) {
    if (this._registry[name] != null) {
      throw new SchematicAlreadyRegistered(name);
    }

    this._registry[name] = schematic;
    this.addProviders([schematic]);
  }

  create(name: string): Schematic {
    if (this._registry[name] == null) {
      throw new SchematicUnknown(name);
    }
    if (!this._injector) {
      this._createInjector();
    }

    return this._injector.get(this._registry[name]);
  }

  install(name: string, sink: Sink = null): Promise<void> {
    if (sink == null) {
      if (!this._injector) {
        this._createInjector();
      }
      sink = this._injector.get(Sink);
    }
    return this.create(name).install(sink);
  }
}
