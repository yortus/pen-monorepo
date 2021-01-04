import * as path from 'path';
import {compile} from 'penc';


const IN_FILE = path.resolve(__dirname, '../fixtures/pen-src/json.pen');
const OUT_FILE = path.resolve(__dirname, '../baselines/pen-dist/json.js');


compile({main: IN_FILE}).save(OUT_FILE);
