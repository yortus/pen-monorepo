import {expect} from 'chai';
// @ts-expect-error Could not find a declaration file for module (7016)
import {parse, print} from '../baselines/pen-dist/math.js';


describe(`Compiling and executing the 'math.pen' program`, () => {

    const tests = [
        // {text: '1234', ast: 1234},
        // {text: '-1.234', ast: -1.234},
        // {text: '1.2e34', ast: 1.2e34, textᐟ: '1.2e+34'},
        // {text: '-1.2e+34', ast: -1.2e34},
        // {text: '1.', ast: 1, textᐟ: '1'},
        // {text: '.234', ast: .234, textᐟ: '0.234'},
        {text: 'i1234', ast: 1234, textᐟ: '1234'},
        {text: 'i12345678', ast: 12345678, textᐟ: '12345678'},
        {text: 'i12345678901', ast: Error},
        {text: '-1234', ast: -1234},
        {text: 'i-1234', ast: Error},
        {text: 'DeadBeef', ast: Error},
        {text: '0xDadBad', ast: 0xdadbad, textᐟ: '14343085'},
        {text: 'dag', ast: Error},
        {text: '0xdag', ast: Error},
        {text: '0xdaf', ast: 0xdaf, textᐟ: '3503'},
        {text: '0b012', ast: Error},
        {text: '0b10101010', ast: 128 + 32 + 8 + 2, textᐟ: '170'},
        {text: '0xDeadBeef', ast: 0xdeadbeef, textᐟ: '3735928559'},
        // TODO: negative hex/bin numbers,
        {
            text: '1+2',
            ast: {
                type: 'add',
                lhs: 1,
                rhs: 2,
            },
        },
        {
            text: '(1+2)*3',
            ast: {
                type: 'mul',
                lhs: {
                    type: 'add',
                    lhs: 1,
                    rhs: 2,
                },
                rhs: 3,
            },
            textᐟ: '(1+2)*3',
        },
        {
            text: '1+(-1-22)*333',
            ast: {
                type: 'add',
                lhs: 1,
                rhs: {
                    type: 'mul',
                    lhs: {
                        type: 'sub',
                        lhs: -1,
                        rhs: 22,
                    },
                    rhs: 333,
                },
            },
        },
        {
            text: '.2*3.14159+4e20*4.e-17',
            ast: {
                type: 'add',
                lhs: {
                    type: 'mul',
                    lhs: 0.2,
                    rhs: 3.14159,
                },
                rhs: {
                    type: 'mul',
                    lhs: 400_000_000_000_000_000_000,
                    rhs: 4e-17,
                },
            },
            textᐟ: '0.2*3.14159+400000000000000000000*4e-17',
        },
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
