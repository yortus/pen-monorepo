import * as fs from 'fs';
import * as path from 'path';
import * as pen from 'pen';




let mathGrammar = fs.readFileSync(path.join(__dirname, '../fixtures/math-grammar.txt'), 'utf8');
let src = pen.getParser(mathGrammar);

if (src.diagnostics.length > 0) {
    for (let d of src.diagnostics) {
        console.log(d.messageText);
    }
}
else {
    console.log(src.javaScriptSource);
    const {parse} = loadModule(src.javaScriptSource) as {parse(text: string): void};

    parse(`12`);
}




function loadModule(cjsSource: string) {
    // tslint:disable-next-line:no-eval
    const resolve = eval(`
        (function(exports) {
            ${cjsSource}
        })
    `) as (exports: any) => void;

    const exports = {} as any;
    resolve(exports);
    return exports;
}
