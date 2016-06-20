#!/usr/bin/env node
const path = require("path");
const fs = require("fs");
const e2eDir = path.resolve('e2e');

require("ts-node").register({
  project: path.join(e2eDir, 'tsconfig.json')
});
const Jasmine = require("jasmine");
const Command = require("jasmine/lib/command.js");

const jasmine = new Jasmine({ projectBaseDir: e2eDir });
const command = new Command(e2eDir, null, console.log);

const configPath = path.join(e2eDir, 'jasmine.json');
const config = JSON.parse(fs.readFileSync(configPath));
if(config.reporters && config.reporters.length > 0) {
  config.reporters.forEach(reporter =>
    jasmine.addReporter(new (require(reporter.name))(reporter.options))
  );
}

process.env['JASMINE_CONFIG_PATH'] = configPath;
command.run(jasmine, [ '**/*.spec.ts' ]);
