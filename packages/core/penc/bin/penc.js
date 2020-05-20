#!/usr/bin/env node


// TODO: do once and commit/publish to get cli working on *nix:
// chmod +x penc-cli.js # Make the file executable


const path = require('path');


// TODO: temp example...
const program = require('commander'); // (normal include)

program
    .option('-o, --out-file <path>', 'output file path')
    .parse(process.argv);

if (program.args.length !== 1) {
    console.error('main path required');
    process.exit(1);
}

const main = program.args[0];
const outFile = program.outFile || main.substr(0, main.length - path.extname(main).length) + '.js';
if (main === outFile) {
    console.error('output would overwrite input');
    process.exit(1);
}


const {compile} = require('..');
compile({main, outFile});
