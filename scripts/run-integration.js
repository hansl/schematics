#!/usr/bin/env node
'use strict';

const glob = require('glob');
const path = require('path');
const Jasmine = require('jasmine');
const JasmineSpecReporter = require('jasmine-spec-reporter');


const projectBaseDir = '../dist';


// Create a Jasmine runner and configure it.
const jasmine = new Jasmine({ projectBaseDir: path.join(__dirname, projectBaseDir) });
jasmine.loadConfig({});
jasmine.addReporter(new JasmineSpecReporter());

// Run the tests.
const files = glob.sync(path.join(__dirname, '../dist/tests/integration/*.js'));
files.forEach(() => {
  jasmine.execute([path.join(projectBaseDir, 'tests/integration/*.js')]);
});
