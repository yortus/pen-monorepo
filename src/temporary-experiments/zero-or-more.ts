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
                    let state = sys.getState();
                    if (state.IMEM === stateₒ.IMEM) break;

                    node = sys.concat(node, state.ODOC);
                }
                sys.setOutState(node);
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
                    let state = sys.getState();
                    if (state.IMEM === stateₒ.IMEM) break;

                    // TODO: support more formats / blob types here, like for parse...
                    sys.assert(typeof state.ODOC === 'string'); // just for now... remove after addressing above TODO
                    text = sys.concat(text, state.ODOC);
                }

                sys.setOutState(text);
                return true;
            },
        };
    },
};
