const glob = require('fast-glob');
const fs = require('fs');
const path = require('path');
const pegjs = require('pegjs');


const SRC_PATH = path.resolve(__dirname, '../src');
const DIST_PATH = path.resolve(__dirname, '../dist');
const inputFiles = glob.sync('**/*.pegjs', {cwd: SRC_PATH, absolute: false});


for (let i = 0; i < inputFiles.length; ++i) {
    inputName = path.basename(inputFiles[i]);
    inputFile = path.resolve(SRC_PATH, inputFiles[i]);
    outputFile = path.resolve(DIST_PATH, inputFiles[i]).replace(/pegjs$/g, 'js');
    let inputTime = fs.statSync(inputFile).mtime.getTime();
    let outputTime = fs.existsSync(outputFile) ? fs.statSync(outputFile).mtime.getTime() : 0;

    process.stdout.write(`Building ${inputName}... `);
    if (outputTime > inputTime) {
        process.stdout.write('SKIPPED (already up-to-date)\n');
    }
    else {
        let src = fs.readFileSync(inputFile, 'utf8');
        let out = pegjs.generate(src, {output: 'source', format: 'commonjs'});
        fs.writeFileSync(outputFile, out);
        process.stdout.write('DONE\n');
    }
}
