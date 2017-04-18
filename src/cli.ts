import { Collection } from './index';
import * as yargs from 'yargs';
import * as path from 'path';


function usage() {
  console.log(`You must provide a component name e.g.: schem component --flag`);
}

export default function cli() {
  const cwd = process.cwd();
  let { _: nonFlags, collection: collectionPath, dryRun, ...options } = yargs.argv;
  collectionPath = collectionPath || './schematics/';
  if (nonFlags.length !== 1) {
    usage();
    return -1;
  }

  // Delete binary entry.
  delete options['$0'];

  const blueprintName = nonFlags[0];
  const collection = new Collection({ path: path.resolve(cwd, collectionPath) });
  const blueprint = collection.createBlueprint(blueprintName, options);
  // collection.install(blueprint);
}

cli();