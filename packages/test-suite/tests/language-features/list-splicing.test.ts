import {expect} from 'chai';
import {compile} from 'penc';


describe(`Language features: list splicing`, () => {
    const {parse, print} = compile({source: `
        start = l1 | l2
        l1 = [a, a, b]
        l2 = [b, ...start, ...l3]
        l3 = ['-', l1] | []
        a = 'a'
        b = 'b'
    `}).eval();

    const tests = [
        {text: 'abc', ast: Error, textᐟ: ''},
        {text: 'aab', ast: ['a', 'a', 'b']},
        {text: 'ab', ast: Error},
        {text: 'aabb', ast: Error},
        {text: '', ast: Error},
        {text: 'baab', ast: ['b', 'a', 'a', 'b']},
        {text: 'bbaab', ast: ['b', 'b', 'a', 'a', 'b']},
        {text: 'bbbaab', ast: ['b', 'b', 'b', 'a', 'a', 'b']},
        {text: 'babab', ast: Error},
        {text: 'bbbaabb', ast: Error},
        {text: 'bbaab-', ast: Error},
        {text: 'bbaab-$', ast: Error},
        {text: 'bbaab-aab', ast: ['b', 'b', 'a', 'a', 'b', '-', ['a', 'a', 'b']]},
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
