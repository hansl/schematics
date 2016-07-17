import 'reflect-metadata';
import {Injector, Provider, ReflectiveInjector, Type} from '@angular/core';

import {Compiler} from '../api/compiler';
import {Context, Entry} from '../api/entry';
import {Schematic} from '../api/schematics';
import {Sink} from '../api/sink';
import {BaseException} from '../core/exception';
import {defaultCompiler} from '../utils/compilers';
import {EventExecutorFn} from '../utils/private';


export class SchematicAlreadyRegisteredException extends BaseException {}
export class SchematicUnknownException extends BaseException {}


export type Providers = Array<Type | Provider | { [k: string]: any; } | any[]>;
export const kContextToken = Symbol();
export type SchematicInstallInfo = {
  context?: Context,
  sink?: Sink,

  // Events that will be hooked when installing the schematic.
  beforeInstall?: EventExecutorFn<void>,
  afterInstall?: EventExecutorFn<void>,
  beforeWriteEntry?: EventExecutorFn<Entry>,
  afterWriteEntry?: EventExecutorFn<Entry>,
  beforeTransformEntry?: EventExecutorFn<Entry>,
  afterTransformEntry?: EventExecutorFn<Entry>
};


export interface SchematicType<T extends Schematic> {
  new (...args: any[]): T;
}


export class Library implements Injector {
  private _injector: Injector = null;
  private _providers: Providers;
  private _registry: { [name: string]: any } = Object.create(null);

  constructor(private _compiler: Compiler, private _parentInjector: Injector = null) {
    this._providers = [{ provide: Compiler, useValue: _compiler }];
  }

  get parentInjector() { return this._parentInjector; }
  set parentInjector(v: Injector) {
    this._parentInjector = v;
    this._injector = null;
  }

  /**
   * @override from Injector
   */
  get(token: any, notFoundValue?: any): any {
    if (!this._injector) {
      this._injector = ReflectiveInjector.resolveAndCreate(this._providers, this._parentInjector);
    }
    return this._injector.get(token, notFoundValue);
  }

  addProviders(providers: Providers) {
    this._providers = this._providers.concat(providers);
    this._injector = null;
  }

  removeProvider(token: Type | Provider | symbol | string) {
    for (let i = 0; i < this._providers.length; i++) {
      const p = this._providers[i];
      let remove = false;
      if (typeof p == 'function' && p === token) {
        remove = true;
      } else if (p instanceof Provider && p.token === token) {
        remove = true;
      } else if (typeof p == 'object' && p['provide'] === token) {
        remove = true;
      }

      if (remove) {
        this._providers.splice(i, 1);
        this._injector = null;
        i--;
      }
    }
  }

  setContext(context: Context) {
    this.removeProvider(kContextToken);
    this.addProviders([{ provide: kContextToken, useValue: context }]);
  }
  setSink(sink: Sink) {
    this.removeProvider(Sink);
    this.addProviders([{ provide: Sink, useValue: sink }]);
  }

  register<U extends Schematic>(name: string, schematic: SchematicType<U>) {
    if (this._registry[name] != null) {
      if (schematic === this._registry[name]) {
        // If it's the same, we just ignore it.
        return;
      }
      throw new SchematicAlreadyRegisteredException(name);
    }

    this._registry[name] = schematic;
    this.addProviders([schematic]);
  }

  unregister<U extends Schematic>(nameOrSchematic: string | SchematicType<U>) {
    if (typeof nameOrSchematic != 'string') {
      for (const key of Object.keys(this._registry)) {
        if (this._registry[key] === nameOrSchematic) {
          this.unregister(key);
        }
      }
      return;
    }

    const name = nameOrSchematic;
    const schematic = this._registry[name];
    if (!schematic) {
      return;
    }
    delete this._registry[name];
    this.removeProvider(schematic);
  }

  create(name: string, context: Context = null): Schematic {
    if (this._registry[name] == null) {
      throw new SchematicUnknownException(name);
    }
    if (context == null) {
      context = this.get(kContextToken, {});
    }

    return this.get(this._registry[name]).transform(context);
  }

  install(name: string, info: SchematicInstallInfo = {}): Promise<void> {
    let {context, sink} = info;
    if (sink == null) {
      sink = this.get(Sink);
    }
    const schematic = this.create(name, context);

    // Install events.
    let beforeInstallObserver = info.beforeInstall &&
      schematic.beforeInstall.subscribe(info.beforeInstall);
    let afterInstallObserver = info.afterInstall &&
      schematic.afterInstall.subscribe(info.afterInstall);
    let beforeTransformEntryObserver = info.beforeTransformEntry &&
      schematic.beforeTransformEntry.subscribe(info.beforeTransformEntry);
    let afterTransformEntryObserver = info.afterTransformEntry &&
      schematic.afterTransformEntry.subscribe(info.afterTransformEntry);
    let beforeWriteEntryObserver = info.beforeWriteEntry &&
      schematic.beforeWriteEntry.subscribe(info.beforeWriteEntry);
    let afterWriteEntryObserver = info.afterWriteEntry &&
      schematic.afterWriteEntry.subscribe(info.afterWriteEntry);

    return schematic.install(sink)
      .then(() => {
        // Remove events.
        if (beforeInstallObserver) {
          beforeInstallObserver.unsubscribe();
        }
        if (afterInstallObserver) {
          afterInstallObserver.unsubscribe();
        }
        if (beforeTransformEntryObserver) {
          beforeTransformEntryObserver.unsubscribe();
        }
        if (afterTransformEntryObserver) {
          afterTransformEntryObserver.unsubscribe();
        }
        if (beforeWriteEntryObserver) {
          beforeWriteEntryObserver.unsubscribe();
        }
        if (afterWriteEntryObserver) {
          afterWriteEntryObserver.unsubscribe();
        }
      });
  }

  static get global() { return globalLibrary; }
}


const globalLibrary: Library = new Library(defaultCompiler);
export function RegisterSchematic(meta: {name: string}): ClassDecorator {
  return (target: SchematicType<any>) => {
    globalLibrary.register(meta.name, target);
  };
}
