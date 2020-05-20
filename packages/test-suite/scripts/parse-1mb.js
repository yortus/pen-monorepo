// Use this script for performance analysis, eg perf/mem profiling, debugging, etc

// Uncomment the following line to generate a .heapsnapshot file
//require('heapdump').writeSnapshot();


let {parse} = require('../baselines/pen-dist/json.js');
let json = require('../fixtures/documents/1mb.json');
let text = JSON.stringify(json, undefined, 4);
let t0 = new Date().getTime();
json = parse(text);
let t1 = new Date().getTime();
console.log(`penc parse took ${t1 - t0}ms`);
