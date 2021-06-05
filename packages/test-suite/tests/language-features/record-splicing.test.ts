import {expect} from 'chai';
import {compile} from 'penc';


describe(`Language features: record splicing`, () => {
    const {parse, print} = compile({source: `
        start = {[alpha]: digit, ...start} | {}
        alpha = "a" | "b" | "c" | "d"
        digit = "1" | "2" | "3" | "4"
    `}).eval();

    const tests = [
        {text: 'a1', ast: {a: '1'}, textᐟ: 'a1'},
        {text: 'a1b2c3', ast: {a: '1', b: '2', c: '3'}},
        {text: '', ast: {}},
        {text: 'a1b2c3d4e5', ast: Error},
        {text: 'a1a2', ast: Error, textᐟ: ''},
        {text: 'aa1', ast: Error},
        {text: 'a1b1c1a1', ast: Error},
        {text: 'a1b1c1d1', ast: {a: '1', b: '1', c: '1', d: '1'}},
    ];

    for (const test of tests) {
        it(test.text, () => {
            let ast: unknown;
            try { ast = parse(test.text); } catch (err) {
                [] = [err];
                ast = Error;
            }
            expect(ast).to.deep.equal(test.ast);
            if (ast === Error) return;
            const textᐟ = print(ast);
            expect(textᐟ).to.equal(test.textᐟ || test.text);
        });
    }
});
