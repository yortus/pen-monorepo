import {expect} from 'chai';
import {compile} from 'penc';


describe(`Language features: abstract/concrete operators`, () => {
    const {parse, print} = compile({source: `
        start = "[" concrete expr "]"   |   "<" abstract expr ">"
        expr = a *(a b) b ?c
        a = "a"
        b = "b"
        c = "c"
    `}).eval();

    const tests = [
        {text: 'abc', ast: Error, textᐟ: ''},
        {text: '[]', ast: Error},
        {text: '[ab]', ast: '[]'},
        {text: '[abc]', ast: '[]', textᐟ: '[ab]'},
        {text: '[abab]', ast: Error},
        {text: '[aabbc]', ast: '[]', textᐟ: '[ab]'},
        {text: '[aabb]', ast: '[]', textᐟ: '[ab]'},
        {text: '[aababababbc]', ast: '[]', textᐟ: '[ab]'},
        {text: '<>', ast: '<ab>', textᐟ: '<>'},
        {text: '<ab>', ast: Error},
        {ast: '<ab>', textᐟ: '<>'},
        {ast: '<abc>', textᐟ: '<>'},
        {ast: '<abcd>', textᐟ: Error},
        {ast: '<abab>', textᐟ: Error},
        {ast: '<aabbc>', textᐟ: '<>'},
        {ast: '<aabb>', textᐟ: '<>'},
        {ast: '<aababababbc>', textᐟ: '<>'},
        // TODO: test lists, records, etc
    ];

    for (const test of tests) {
        it(test.text ?? test.ast, () => {
            let ast: unknown;
            if (test.text !== undefined) {
                try { ast = parse(test.text); } catch (err) {
                    [] = [err];
                    ast = Error;
                }
                expect(ast).to.deep.equal(test.ast);
                if (ast === Error) return;
            }
            else {
                ast = test.ast;
            }

            let textᐟ: unknown;
            try { textᐟ = print(ast); } catch (err) {
                [] = [err];
                textᐟ = Error;
            }
            expect(textᐟ).to.equal(test.textᐟ || test.text);
        });
    }
});
