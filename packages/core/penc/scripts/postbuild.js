const glob = require('fast-glob');
const fs = require('fs-extra');
const path = require('path');
const pegjs = require('pegjs');


buildPegGrammars();
copyPenRuntime();
copyPenExtensions();


function buildPegGrammars() {
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
            fs.ensureDirSync(path.dirname(outputFile));
            fs.writeFileSync(outputFile, out);
            process.stdout.write('DONE\n');
        }
    }
}


function copyPenRuntime() {
    process.stdout.write(`Copying pen runtime... `);
    let penrtPath = require.resolve('penrt');
    let targetPath = path.resolve(__dirname, '../dist/deps/penrt.js');
    fs.ensureDirSync(path.dirname(targetPath));
    fs.copyFileSync(penrtPath, targetPath);
    process.stdout.write('DONE\n');
}


function copyPenExtensions() {
    const extensionPaths = [
        require.resolve('@ext/standard-library'),
        require.resolve('@ext/experimental-features'),
    ];

    process.stdout.write(`Copying pen extensions... `);
    for (let extensionPath of extensionPaths) {
        let filename = path.basename(extensionPath);
        let targetPath = path.resolve(__dirname, '../dist/deps', filename);
        fs.ensureDirSync(path.dirname(targetPath));
        fs.copyFileSync(extensionPath, targetPath);
    }
    process.stdout.write('DONE\n');
}
