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

                node = sys.concat(node, ODOC);
            }
            ODOC = node;
            return true;
        },

        unparse() {
            let IMEMₒ = IMEM;
            let text: unknown;
            while (true) {
                if (!expr.unparse()) break;

                // TODO: check if any input was consumed...
                // if not, stop iterating, since otherwise we may loop forever
                // TODO: any other checks needed? review...
                if (IMEM === IMEMₒ) break;

                // TODO: support more formats / blob types here, like for parse...
                assert(typeof ODOC === 'string'); // just for now... remove after addressing above TODO
                text = concat(text, ODOC);
            }

            ODOC = text;
            return true;
        },
    };
}
