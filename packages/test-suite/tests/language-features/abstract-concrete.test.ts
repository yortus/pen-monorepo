import {expect} from 'chai';
import {compile} from 'penc';


describe(`Language features: abstract/concrete operators`, () => {
    const {parse, print} = compile({source: `
        start =
            | "[" concrete expr "]"
            | "<" abstract expr ">"
            | L2
            | L3
            | L4
            | L5
            | L6
            | L7
            | L8
            | L9
        expr = a *(a b) b ?c
        a = "a"
        b = "b"
        c = "c"

        L2 = 'L2 ' abstract ["a", "b", "c"]
        L3 = 'L3 ' concrete ["a", "b", "c"]
        L4 = 'L4 ' abstract {a="aaa", b="bbb", c="ccc"}
        L5 = 'L5 ' concrete {a="aaa", b="bbb", c="ccc"}
        L6 = ["L6 ", abstract abstract [a]]
        L7 = ["L7 ", abstract concrete [a]]
        L8 = ["L8 ", concrete abstract [a]]
        L9 = ["L9 ", concrete concrete [a]]
    `}).eval();

    const tests = [
        {text: 'abc', ast: Error, textᐟ: ''},
        // {text: '[]', ast: Error},
        // {text: '[ab]', ast: '[]'},
        // {text: '[abc]', ast: '[]', textᐟ: '[ab]'},
        // {text: '[abab]', ast: Error},
        // {text: '[aabbc]', ast: '[]', textᐟ: '[ab]'},
        // {text: '[aabb]', ast: '[]', textᐟ: '[ab]'},
        // {text: '[aababababbc]', ast: '[]', textᐟ: '[ab]'},
        // {text: '<>', ast: '<ab>', textᐟ: '<>'},
        // {text: '<ab>', ast: Error},
        // {ast: '<ab>', textᐟ: '<>'},
        // {ast: '<abc>', textᐟ: '<>'},
        // {ast: '<abcd>', textᐟ: Error},
        // {ast: '<abab>', textᐟ: Error},
        // {ast: '<aabbc>', textᐟ: '<>'},
        // {ast: '<aabb>', textᐟ: '<>'},
        // {ast: '<aababababbc>', textᐟ: '<>'},
        // // TODO: test lists, records, etc
        // {text: 'L2 abc', ast: Error},
        // {text: 'L2 ', ast: ['a', 'b', 'c']},
        // {ast: ['a', 'b', 'c'], textᐟ: 'L2 '},
        // {text: 'L3 abc', ast: undefined},
        // {text: 'L4 abc', ast: Error},
        // {text: 'L4 ', ast: {a: 'aaa', b: 'bbb', c: 'ccc'}},
        // {ast: {a: 'aaa', b: 'bbb', c: 'ccc'}, textᐟ: 'L4 '},
        // {text: 'L5 aaabbbccc', ast: undefined, textᐟ: 'L3 abc'},
        // {ast: undefined, textᐟ: 'L3 abc'},

        // {text: 'L6 a', ast: Error},
        // {text: 'L6 ', ast: ['L6 ', ['a']], textᐟ: Error},
        // {text: 'L7 a', ast: Error},
        {text: 'L7 ', ast: ['L7 ', undefined]}, // TODO: <==== why does this throw in the parser? 'cannot call .toString of undefined'
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
