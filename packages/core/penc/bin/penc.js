#!/usr/bin/env node


// TODO: do once and commit/publish to get cli working on *nix:
// chmod +x penc-cli.js # Make the file executable


// TODO: temp example...
const program = require('commander'); // (normal include)

program
  .option('-f, --force', 'force installation')
  .parse(process.argv);

const pkgs = program.args;

if (!pkgs.length) {
  console.error('packages required');
  process.exit(1);
}

console.log();
if (program.force) console.log('  force: install');
pkgs.forEach(function(pkg) {
  console.log('  install : %s', pkg);
});
console.log();
