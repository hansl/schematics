#!/usr/bin/env node

import * as yargs from 'yargs';
import * as path from 'path';
import { existsSync } from 'fs';
import { Observable } from 'rxjs/Observable';

import {
  Collection,
  BlueprintNotFoundException,
  CreateAction,
  PrependRoot,
  WriteFile,
  LogActions
} from './index';

import 'rxjs/add/operator/let';
import 'rxjs/add/operator/do';


export function findUp(names: string | string[], from: string, stopOnNodeModules = false) {
  if (!Array.isArray(names)) {
    names = [names];
  }
  const root = path.parse(from).root;

  let currentDir = from;
  while (currentDir && currentDir !== root) {
    for (const name of names) {
      const p = path.join(currentDir, name);
      if (existsSync(p)) {
        return p;
      }
    }

    if (stopOnNodeModules) {
      const nodeModuleP = path.join(currentDir, 'node_modules');
      if (existsSync(nodeModuleP)) {
        return null;
      }
    }

    currentDir = path.dirname(currentDir);
  }

  return null;
}

function usage(collection: Collection) {
  console.log(`
    ERROR: You must provide a blueprint name e.g.: "schem blueprint-name --flag=value".

    Available blueprints in the ${collection.name} collection:
    ${collection.blueprints.map(bp => `    ${bp.name}: ${bp.description}`)}
  `);

}

export default function cli() {
  // Compute paths.
  const cwd = process.cwd();
  const projectRoot = path.dirname(findUp('package.json', cwd, true));

  // Parse args.
  let { _: nonFlags, collection: collectionPath, dryRun, ...options } = yargs.argv;
  collectionPath = collectionPath || './schematics/';
  // Delete binary path entry.
  delete options['$0'];

  // Load collection.
  const collection = new Collection({ path: path.resolve(projectRoot, collectionPath) });

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

  // Source & transform.
  const actions = blueprint.load(options)
    .let(LogActions());

  // Sink.
  let promise;
  if (!dryRun) {
    const writeSink = new WriteFile(cwd);
    promise = writeSink.install(actions)
  } else {
    promise = actions.toPromise();
  }

  return promise.catch((err) => { console.log(err); return -1; })
}

cli();