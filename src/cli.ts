import { Collection, BlueprintNotFoundException } from './index';
import * as yargs from 'yargs';
import * as path from 'path';


function usage(collection: Collection) {
  console.log(`
    ERROR: You must provide a blueprint name e.g.: "schem blueprint-name --flag=value".

    Available blueprints in the ${collection.name} collection:
    ${collection.blueprints.map(bp => `    ${bp.name}: ${bp.description}`)}
  `);

}

export default function cli() {
  const cwd = process.cwd();
  let { _: nonFlags, collection: collectionPath, dryRun, ...options } = yargs.argv;
  collectionPath = collectionPath || './schematics/';
  // Delete binary path entry.
  delete options['$0'];

  // Load collection.
  const collection = new Collection({ path: path.resolve(cwd, collectionPath) });

  // Load blueprint.
  if (nonFlags.length !== 1) {
    usage(collection);
    return -1;
  }
  const blueprintName = nonFlags[0];

  let blueprint;
  try {
    blueprint = collection.getBlueprint(blueprintName);
  } catch (err) {
    if (err instanceof BlueprintNotFoundException) {
      console.log('Blueprint not found in collection.')
    } else {
      throw err;
    }
  }
  blueprint.load(options);
}

cli();