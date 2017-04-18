// import { Collection } from 'schematics';
import * as yargs from 'yargs';

function usage() {
  console.log(`You must provide a component name e.g.: schem component --flag`);
}

export default function cli() {
  let { _: nonFlags, collection: collectionPath, dryRun, ...options } = yargs.argv;
  collectionPath = collectionPath || './schematics/';
  if (nonFlags.length !== 1) {
    usage();
    return -1;
  }

  const blueprintName = nonFlags[0];
  console.log(`
    collection: ${collectionPath},
    blueprintName: ${blueprintName},
    options: ${JSON.stringify(options)},
  `)
  // const collection = new Collection({ path: collectionPath });
  // const blueprint = collection.createBlueprint(blueprintName, options);
  // blueprint.install(blueprint);
}

cli();