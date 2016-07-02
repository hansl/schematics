#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const execSync = require('child_process').execSync;


let debounced = false;
function runTests() {
  debounced = false;
  const script = path.join(__dirname, 'run-spec.js');
  const output = execSync(script, { encoding: 'utf8' });
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
