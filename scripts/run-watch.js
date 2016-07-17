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


const runTests = debounce(function() {
  console.log('Change detected... Running the tests');

  try {
    const output = execSync(path.join(__dirname, 'run-spec.js'), { encoding: 'utf-8' });
    console.log(output);
  } catch (err) {
  }
}, 100);

// Run once.
runTests();


fs.watch(path.join(__dirname, '../dist'), { recursive: true }, runTests);
