import * as stage01 from './stage-01';
import * as stage02 from './stage-02';
import * as stage03 from './stage-03';
import * as stage04 from './stage-04';


export function pipeline(text: string): string {
    let temp01 = stage01.process(text);
    let temp02 = stage02.process(temp01);
    let temp03 = stage03.process(temp02);
    let result = stage04.process(temp03);
    return result;
}
