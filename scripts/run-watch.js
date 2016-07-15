#!/usr/bin/env node
'use strict';

const execSync = require('child_process').execSync;
const fs = require('fs');
const path = require('path');


let debounced = false;
function buildTests() {
  const script = path.resolve('node_modules/.bin/tsc');
  const output = execSync(`${script} -p tests`, { encoding: 'utf-8' });
  console.log(output);
}
function runTests() {
  buildTests();

  debounced = false;
  const script = path.join(__dirname, 'run-spec.js');
  const output = execSync(script, { encoding: 'utf-8' });
  console.log(output);
}
// Run once.
runTests();


fs.watch(path.join(__dirname, '../dist'), { recursive: true }, function(event, fileName) {
  if (!fileName || /\.js$/.test(fileName)) {
    return;
  }
  if (!debounced) {
    debounced = true;
    setTimeout(runTests, 10);
  }
});
