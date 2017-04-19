// import { Observable } from 'rxjs/Observable';
// import { Action, ApplyLodashCompiler } from '@angular-sdk/schematics';

// function transformFactory(options: any) {
//   return (source: Observable<Action>) => {
//     return source
//       // Remove spec files if the spec option is false.
//       .filter(action => options.spec || !(action.path && action.path.endsWith('.spec.ts')))
//       // Apply a lodash template compiler to every file created in source.
//       .let(ApplyLodashCompiler(options));
//   };
// }

module.exports = {
  name: 'component',
  description: 'Create an Angular component and import it in the closest module.',
  source: 'file://./templates/',
  // transformFactory,
  schema: require('./schema.json')
};