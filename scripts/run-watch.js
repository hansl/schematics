#!/usr/bin/env node
'use strict';

const execSync = require('child_process').execSync;
const fs = require('fs');
const path = require('path');


function debounce(fn, wait) {
  let debounced = false;
  return function() {
    if (debounced) {
      return;
    }
    const context = this;
    const args = arguments;

    debounced = true;
    setTimeout(function() {
      debounced = false;
      fn.apply(context, args);
    }, wait || 100)
  };
}


const runTests = debounce(() => {
  console.log('Change detected... Running the tests');

  try {
    let output = execSync(`${path.resolve('node_modules/.bin/tsc')} -p tests`);
    console.log(output.toString());

    output = execSync(path.join(__dirname, 'run-spec.js'));
    console.log(output.toString());
  } catch (err) {
    console.error('An error occured:', err.stderr.toString());
  }
});

// Run once.
runTests();


fs.watch(path.join(__dirname, '../src'), { recursive: true }, runTests);
fs.watch(path.join(__dirname, '../tests'), { recursive: true }, runTests);
