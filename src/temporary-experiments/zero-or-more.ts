function zeroOrMore(expr: Rule): Rule {
    return {
        kind: 'rule',

        parse() {
            let IMEMₒ = IMEM;
            let node: unknown;
            while (true) {
                if (!expr.parse()) break;

                // TODO: check if any input was consumed...
                // if not, stop iterating, since otherwise we may loop forever
                if (IMEM === IMEMₒ) break;

                // TODO: copypasta from Sequence above... make DRY
                if (node === undefined) node = ODOC;
                // TODO: generalise below cases to a helper function that can be extended for new formats / blob types
                else if (typeof node === 'string' && typeof ODOC === 'string') node += ODOC;
                else if (Array.isArray(node) && Array.isArray(ODOC)) node = [...node, ...ODOC];
                else if (isPlainObject(node) && isPlainObject(ODOC)) node = {...node, ...ODOC};
                else if (ODOC !== undefined) throw new Error(`Internal error: invalid sequence`);
            }
            ODOC = node;
            return true;
        },

        unparse() {
            let IMEMₒ = IMEM;
            let text = '';
            while (true) {
                if (!expr.unparse()) break;

                // TODO: check if any input was consumed...
                // if not, stop iterating, since otherwise we may loop forever
                // TODO: any other checks needed? review...
                if (IMEM === IMEMₒ) break;
                // TODO: support more formats / blob types here, like for parse...
                assert(typeof ODOC === 'string'); // just for now... remove after addressing above TODO
                text += ODOC;
            }

            ODOC = text;
            return true;
        },
    };
}
