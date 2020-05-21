const fs = require('fs');
const path = require('path');
const {compile} = require('penc');


const SRC_PATH = path.resolve(__dirname, '../fixtures/pen-src');
const DIST_PATH = path.resolve(__dirname, '../baselines/pen-dist');
const inputFiles = fs.readdirSync(SRC_PATH);


for (let i = 0; i < inputFiles.length; ++i) {
    inputName = path.basename(inputFiles[i]);
    inputFile = path.resolve(SRC_PATH, inputFiles[i]);
    outputFile = path.resolve(DIST_PATH, inputFiles[i]).replace(/\.pen$/g, '') + '.js';
    compilerFile = require.resolve('penc');
    let inputTime = fs.statSync(inputFile).mtime.getTime();
    let outputTime = fs.existsSync(outputFile) ? fs.statSync(outputFile).mtime.getTime() : 0;
    let compilerTime = fs.statSync(compilerFile).mtime.getTime();

    // Re-build if either the input grammar or the compiler changed since the output file was written.
    process.stdout.write(`Building ${inputName}... `);
    if (outputTime > inputTime && outputTime > compilerTime) {
        process.stdout.write('SKIPPED (already up-to-date)\n');
    }
    else {
        compile({
            main: inputFile,
            outFile: outputFile,
        });
        process.stdout.write('DONE\n');
    }
}
