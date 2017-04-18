// export function ImportIntoModule(host: BlueprintHost, name: string, path: string) {
//   const modulePath = blueprints.ng.findModulePath(host, path);
//   const declareEntry = blueprints.ng.AddNgModuleDeclaration(host, modulePath, path, name);
//   return Observable.of(declareEntry);
// }

// export default function (options: Options) {
//   return (source: Observable<Entry>) => {
//     return source
//       // Remove specs if necessary.
//       .filter(entry => entry.path && options.spec ? true : entry.path.endsWith('.spec.ts'))
//       // Add a new action to add the import statement in the module.
//       .concat(ImportIntoModule(options.entityName, fileName));
//   }
// }