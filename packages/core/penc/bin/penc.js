#!/usr/bin/env node


// TODO: do once and commit/publish to get cli working on *nix:
// chmod +x penc-cli.js # Make the file executable


const program = require('commander');
const path = require('path');
const {version} = require('../package.json');


// Declare the command line syntax.
program
    .version(version, '-v, --version', 'print penc version')
    .arguments('<path>')
    .option('-o, --out-file <path>', 'specify the output path');

// Parse/validate the command line arguments.
program.parse(process.argv);
if (program.args.length !== 1) program.help();

// Invoke the pen compiler with the given arguments.
const {compile} = require('..');
const main = program.args[0];
const outFile = program.outFile;
compile({main, outFile});
