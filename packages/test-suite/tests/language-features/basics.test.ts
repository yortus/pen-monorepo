import {expect} from 'chai';
import {compile} from 'penc';


describe(`Language features: basics`, async () => {
    const {parse, print} = compile({source: `
        start = a (a b)* b
        a = "a"
        b = "b"
    `}).eval();

    const tests = [
        {text: 'abc', ast: Error, textᐟ: ''},
        {text: 'ab', ast: 'ab'},
        {text: 'aabb', ast: 'aabb'},
        {text: '', ast: Error},
        {text: 'abab', ast: Error},
        {text: 'aabababababb', ast: 'aabababababb'},
        {text: 'aaaaabbbb', ast: Error},
        {text: 'aaaabbbbb', ast: Error},
        {text: 'aababababababababababababababababababababb', ast: 'aababababababababababababababababababababb'},
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
