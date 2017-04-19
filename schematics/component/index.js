const camelCase = require('lodash').camelCase;
const upperFirst = require('lodash').upperFirst;

const LodashCompiler = require('../../dist/low-level/transform').LodashCompiler;

require('rxjs/add/operator/filter');


function transformFactory(options) {
  const templateVariables = {
    selector: options.name,
    dasherizedModuleName: options.name,
    classifiedModuleName: upperFirst(camelCase(options.name)),
  }
  return (source) => {
    return source
      // Remove spec files if the spec option is false.
      .filter(action => options.spec || !(action.path && action.path.endsWith('.spec.ts')))
      // Apply a lodash template compiler to every file created in source.
      .let(LodashCompiler({ variables: templateVariables }));
  };
}

module.exports = {
  name: 'component',
  description: 'Create an Angular component and import it in the closest module.',
  source: 'file://./templates/',
  transformFactory,
  schema: require('./schema.json')
};