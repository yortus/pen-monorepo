import {transpileToJS} from './transpile-to-js';




export function evaluate(grammar: string) {
    let src = transpileToJS(grammar);

    let diagnostics = [...src.parse.diagnostics, ...src.unparse.diagnostics];
    if (diagnostics.length > 0) {
        throw new Error(`Transpilation failed with ${diagnostics.length} error(s): ${diagnostics.join('\n')}`);
    }

    // TODO: was... remove... console.log(src.parse.javaScriptSource);

    const {parse} = loadModule(src.parse.javaScriptSource) as {parse(text: string): unknown};
    const {unparse} = loadModule(src.unparse.javaScriptSource) as {unparse(ast: unknown): string};
    return {parse, unparse};
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
