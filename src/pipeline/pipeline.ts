import {Options} from '../options';
import * as stage01 from './stage-01';
// import * as stage02 from './stage-02';
// import * as stage03 from './stage-03';
// import * as stage04 from './stage-04';
// import * as stage05 from './stage-05';


export function pipeline(options: Options) {
    let temp01 = stage01.process(options);
    // let temp02 = stage02.process(temp01);
    // let temp03 = stage03.process(temp02);
    // let result = stage04.process(temp03);
    let result = temp01;
    return result;
}
