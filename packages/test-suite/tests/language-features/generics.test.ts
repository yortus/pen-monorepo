import {expect} from 'chai';
import {compile} from 'penc';


describe(`Language features: generics`, () => {
    const L1 = compile({source: `
        x = "OUTER"
        ns = (
            gen = (a) => [a, x, a]
            x = "INNER"
            a = "FURPHY"
        )
        start = ns.gen(a = x)
    `}).eval();

    const L2 = compile({source: `
        start = gen("hi")
        gen = r => (start where
            start = rDash rDash
            rDash = enclose(r)
            enclose = makeEncloser(
                lp="("
                rp=")"
            )
            makeEncloser = (lp, rp) => (x => lp x rp)
        )
    `}).eval();

    const tests = [
        {lang: L1, text: 'abc', ast: Error, textᐟ: ''},
        {lang: L1, text: 'OUTERINNEROUTER', ast: ['OUTER', 'INNER', 'OUTER']},
        {lang: L2, text: 'hihi', ast: Error},
        {lang: L2, text: '(hi)(hi)', ast: '(hi)(hi)'},
    ];

    for (const {lang, text, ast, textᐟ} of tests) {
        it(text, () => {
            let actualAst: unknown;
            try {
                actualAst = lang.parse(text);
            }
            catch (err) {
                [] = [err];
                actualAst = Error;
            }
            expect(actualAst).to.deep.equal(ast);
            if (ast === Error) return;
            const actualTextᐟ = lang.print(ast);
            expect(actualTextᐟ).to.equal(textᐟ || text);
        });
    }
});
