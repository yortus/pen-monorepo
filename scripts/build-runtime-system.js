const path = require('path');
const fs = require('fs-extra');


const srcPath = path.join(__dirname, '../dist/runtime-system');
const outPath = path.join(__dirname, '../dist/sys.js');
const filenames = fs.readdirSync(srcPath).filter(fn => path.extname(fn) === '.js');
let outText = '';
for (let filename of filenames) {
    let fileText = fs.readFileSync(path.join(srcPath, filename), 'utf8') + '\n';
    fileText = fileText
        .replace(/"use strict";[\r\n]*/, '')
        .replace(/\/\/# sourceMappingURL.*/, '');
    outText += fileText;
}
fs.writeFileSync(outPath, outText, 'utf8');
