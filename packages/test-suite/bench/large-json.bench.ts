// tslint:disable: no-console
import * as Benchmark from 'benchmark';
import * as fs from 'fs-extra';
import * as path from 'path';
// @ts-expect-error Could not find a declaration file for module (7016)
import {parse as penParse} from '../baselines/pen-dist/json.js';
import {parse as pegParse} from './pegjs-json-parser';


let json = fs.readFileSync(path.join(__dirname, '../fixtures/documents/1mb.json'), 'utf8');
const suite = new Benchmark.Suite();


// Add tests.
suite.add('V8', () => JSON.parse(json));
suite.add('penc', () => penParse(json));
suite.add('pegjs', () => pegParse(json));


// Add listeners.
suite.on('cycle', (event: Benchmark.Event) => {
    let avg = Math.round(event.target.stats!.mean * 1000);
    console.log(`${event.target}   avg=${avg}ms/op`);
});
suite.on('complete', () => console.log('Finished.'));


// Run the benchmarks.
console.log('Running benchmarks...');
suite.run();
