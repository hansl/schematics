// import {Injector, ReflectiveInjector} from '@angular/core';
// import {BaseException} from '../exception';


// export class SchematicAlreadyRegisteredException extends BaseException {
//   constructor(public name: string) {
//     super();
//   }
// }
// export class SchematicUnknownException extends BaseException {
//   constructor(public name: string) {
//     super();
//   }
// }


// export class Library implements Injector {
//   private _registry: Map<string, Function> = new Map();
//   private _injector: Injector;

//   constructor(private _parentInjector: Injector = null) {}

//   create(name: string): any {
//     if (!this._registry.has(name)) {
//       throw new SchematicUnknownException(name);
//     }

//     return this.get(this._registry.get(name));
//   }

//   /**
//    * @override from Injector
//    */
//   get(token: any, notFoundValue?: any): any {
//     if (!this._injector) {
//       this._injector = this._createInjector();
//     }
//     return this._injector.get(token, notFoundValue);
//   }

//   register<T extends Function>(name: string, schematic: T) {
//     if (this._registry.has(name)) {
//       if (this._registry.get(name) !== schematic) {
//         throw new SchematicAlreadyRegisteredException(name);
//       }
//       return;
//     }

//     this._registry.set(name, schematic);
//   }

//   unregister<U extends Function>(nameOrSchematic: string | U) {
//     if (typeof nameOrSchematic != 'string') {
//       this._registry.forEach((_, key) => {
//         if (this._registry.get(key) === nameOrSchematic) {
//           this.unregister(key);
//         }
//       });
//       return;
//     }

//     const name: string = nameOrSchematic;
//     const schematic = this._registry.get(name);

//     if (!schematic) {
//       return;
//     }
//     this._registry.delete(name);
//   }

//   private _createInjector(): Injector {
//     const providers: Array<any> = [];
//     this._registry.forEach((entry) => ({
//       provide: entry,
//       useClass: entry
//     }));

//     return ReflectiveInjector.resolveAndCreate(providers, this._parentInjector);
//   }

//   static get global(): Library {
//     return kGlobalLibrary;
//   }
// }


// const kGlobalLibrary = new Library();
