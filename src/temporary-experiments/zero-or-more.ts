const zeroOrMore: Lambda = {
    kind: 'lambda',
    apply(expr: Rule): Rule {
        return {
            kind: 'rule',

            parse() {
                let stateₒ = sys.getState();
                let node: unknown;
                while (true) {
                    if (!expr.parse()) break;

                    // TODO: check if any input was consumed...
                    // if not, stop iterating, since otherwise we may loop forever
                    if (IMEM === stateₒ.IMEM) break;

                    node = sys.concat(node, ODOC);
                }
                ODOC = node;
                return true;
            },

            unparse() {
                let stateₒ = sys.getState();
                let text: unknown;
                while (true) {
                    if (!expr.unparse()) break;

                    // TODO: check if any input was consumed...
                    // if not, stop iterating, since otherwise we may loop forever
                    // TODO: any other checks needed? review...
                    if (IMEM === stateₒ.IMEM) break;

                    // TODO: support more formats / blob types here, like for parse...
                    sys.assert(typeof ODOC === 'string'); // just for now... remove after addressing above TODO
                    text = sys.concat(text, ODOC);
                }

                ODOC = text;
                return true;
            },
        };
    },
};
