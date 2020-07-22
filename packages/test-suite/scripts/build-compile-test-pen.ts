import * as path from 'path';
import {compile} from 'penc';


const IN_FILE = path.resolve(__dirname, '../fixtures/pen-src/compile-test.pen');
const OUT_FILE = path.resolve(__dirname, '../baselines/pen-dist/compile-test.js');


compile({
    main: IN_FILE,
    outFile: OUT_FILE,
});
