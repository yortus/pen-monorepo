import {expect} from 'chai';
import {compile} from 'penc';


describe(`Language features: generics`, async () => {
    const {parse, print} = compile({source: `
        x = "OUTER"

        nested = (
            REP = (a) => [a, x, a]
            x = "INNER"
            a = "FURPHY"
        )
        
        start = nested.REP(a = x)
    `}).eval();

    const tests = [
        {text: 'abc', ast: Error, textᐟ: ''},
        {text: 'OUTERINNEROUTER', ast: ['OUTER', 'INNER', 'OUTER']},
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
