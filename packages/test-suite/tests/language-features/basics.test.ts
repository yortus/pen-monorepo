import {expect} from 'chai';
import {compile} from 'penc';


describe(`Language features: basics`, () => {
    const {parse, print} = compile({source: `
        start = a   0..m(a b)   b   0..1 c
        a = 'a'
        b = 'b'
        c = 'c'
    `}).eval();

    const tests = [
        {text: 'abc', ast: 'abc'},
        {text: 'abd', ast: Error, textᐟ: ''},
        {text: 'abcd', ast: Error},
        {text: 'ab', ast: 'ab'},
        {text: 'aabb', ast: 'aabb'},
        {text: '', ast: Error},
        {text: 'abab', ast: Error},
        {text: 'aabababababb', ast: 'aabababababb'},
        {text: 'aabababababbc', ast: 'aabababababbc'},
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
