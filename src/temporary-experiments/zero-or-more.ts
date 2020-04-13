function zeroOrMore(expr: Rule): Rule {
    return {
        kind: 'rule',

        parse() {
            let IPTRₒ = IPTR;
            let node: unknown;
            while (true) {
                if (!expr.parse()) break;

                // TODO: check if any input was consumed...
                // if not, stop iterating, since otherwise we may loop forever
                if (IPTR === IPTRₒ) break;

                // TODO: copypasta from Sequence above... make DRY
                if (node === undefined) node = OUT;
                // TODO: generalise below cases to a helper function that can be extended for new formats / blob types
                else if (typeof node === 'string' && typeof OUT === 'string') node += OUT;
                else if (Array.isArray(node) && Array.isArray(OUT)) node = [...node, ...OUT];
                else if (isPlainObject(node) && isPlainObject(OUT)) node = {...node, ...OUT};
                else if (OUT !== undefined) throw new Error(`Internal error: invalid sequence`);
            }
            OUT = node;
            return true;
        },

        unparse() {
            let IPTRₒ = IPTR;
            let text = '';
            while (true) {
                if (!expr.unparse()) break;

                // TODO: check if any input was consumed...
                // if not, stop iterating, since otherwise we may loop forever
                // TODO: any other checks needed? review...
                if (IPTR === IPTRₒ) break;
                // TODO: support more formats / blob types here, like for parse...
                assert(typeof OUT === 'string'); // just for now... remove after addressing above TODO
                text += OUT;
            }

            OUT = text;
            return true;
        },
    };
}
