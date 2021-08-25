import {expect} from 'chai';
import {compile} from 'penc';


describe(`Language features: abstract/concrete operators`, () => {
    const {parse, print} = compile({source: `
        start =
            | \`[\` concrete expr \`]\`
            | \`<\` abstract expr \`>\`
            | L2 | L3 | L4
            | L5 | L6 | L7 | L8 | L9
        expr = a   0..m(a b)   b   0..1 c
        a = \`a\`
        b = \`b\`
        c = \`c\`

        L2 = [\`L2 \`]   [abstract [a, b] concrete [b, c]]
        L3 = [\`L3 \`]   [concrete [a, b] abstract [b, c]]
        L4 = [\`L4 \`]   [abstract {a:\`A\`, b:\`B\`, c:\`C\`}]
        L5 = [\`L5 \`]   [concrete {a:\`A\`, b:\`B\`, c:\`C\`}]
        L6 = [\`L6 \`]   [abstract abstract a b]
        L7 = [\`L7 \`]   [abstract concrete a b]
        L8 = [\`L8 \`]   [concrete abstract a b]
        L9 = [\`L9 \`]   [concrete concrete a b]
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
        {text: 'L2 ', ast: Error},
        {text: 'L2 bc', ast: ['L2 ', ['a', 'b']]},
        {ast: ['L2 ', ['a', 'b']], textᐟ: 'L2 bc'},
        {text: 'L3 ', ast: Error},
        {text: 'L3 ab', ast: ['L3 ', ['b', 'c']]},
        {text: 'L4 ABC', ast: Error},
        {text: 'L4 ', ast: ['L4 ', {a: 'A', b: 'B', c: 'C'}]},
        {ast: ['L4 ', {a: 'A', b: 'B', c: 'C'}], textᐟ: 'L4 '}, 
        {text: 'L5 ABC', ast: Error},
        {text: 'L5 ', ast: Error},
        {ast: ['L5 ', {a: 'A', b: 'B', c: 'C'}], textᐟ: Error}, 
        {text: 'L6 ab', ast: Error},
        {text: 'L6 a', ast: Error},
        {text: 'L6 b', ast: ['L6 ', 'ab']},
        {text: 'L6 ', ast: Error},
        {text: 'L7 ab', ast: Error},
        {text: 'L7 a', ast: Error},
        {text: 'L7 b', ast: ['L7 ', 'b']},
        {text: 'L7 ', ast: Error},
        {text: 'L8 ab', ast: Error},
        {text: 'L8 a', ast: Error},
        {text: 'L8 b', ast: ['L8 ', 'b']},
        {text: 'L8 ', ast: Error},
        {text: 'L9 ab', ast: ['L9 ', 'b']},
        {text: 'L9 a', ast: Error},
        {text: 'L9 b', ast: Error},
        {text: 'L9 ', ast: Error},
    ];

    for (const test of tests) {
        it(test.text ?? JSON.stringify(test.ast ?? 'undefined'), () => {
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
