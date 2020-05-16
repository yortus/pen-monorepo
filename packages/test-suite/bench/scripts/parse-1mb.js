let {parse} = require('../../baselines/penc-output/json.js');
let json = require('../../fixtures/documents/1mb.json');


let text = JSON.stringify(json);
let t0 = new Date().getTime();
json = parse(text);
let t1 = new Date().getTime();
console.log(`penc parse took ${t1 - t0}ms`);
