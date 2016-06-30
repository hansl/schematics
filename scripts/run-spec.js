#!/usr/bin/env node
const path = require("path");
const fs = require("fs");

const Jasmine = require("jasmine");
const JasmineSpecReporter = require('jasmine-spec-reporter');

const projectBaseDir = path.resolve(__dirname, '../src');


// TypeScript loader.
require("ts-node").register({
  project: path.join(projectBaseDir, 'tsconfig.json')
});

// Load the definitions for specs.
require(path.join(projectBaseDir, 'specs.d.ts'));


// Create a Jasmine runner and configure it.
const jasmine = new Jasmine({ projectBaseDir });

jasmine.addReporter(new JasmineSpecReporter({}));
jasmine.loadConfigFile(path.join(projectBaseDir, 'jasmine.json'));

// Run the tests.
jasmine.execute([ path.normalize('**/*.spec.ts') ]);
