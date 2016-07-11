#!/usr/bin/env node
'use strict';

const path = require("path");
const Jasmine = require("jasmine");


const projectBaseDir = '../dist';


// Create a Jasmine runner and configure it.
const jasmine = new Jasmine({ projectBaseDir: path.join(__dirname, projectBaseDir) });
jasmine.loadConfig({});

// Run the tests.
jasmine.execute([ path.join(projectBaseDir, '**/*.spec.js') ]);
