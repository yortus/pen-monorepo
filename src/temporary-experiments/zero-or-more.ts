function zeroOrMore(expr: Rule): Rule {
    return {
        kind: 'rule',

        parse(text, pos, result) {
            let node: unknown;
            while (true) {
                if (!expr.parse(text, pos, result)) break;

                // TODO: check if any input was consumed...
                // if not, stop iterating, since otherwise we may loop forever
                if (pos === result.posᐟ) break;

                // TODO: copypasta from Sequence above... make DRY
                pos = result.posᐟ;
                if (node === undefined) node = result.node;
                else if (typeof node === 'string' && typeof result.node === 'string') node += result.node;
                else if (Array.isArray(node) && Array.isArray(result.node)) node = [...node, ...result.node];
                else if (isPlainObject(node) && isPlainObject(result.node)) node = {...node, ...result.node};
                else if (result.node !== undefined) throw new Error(`Internal error: invalid sequence`);
            }

            result.node = node;
            result.posᐟ = pos;
            return true;
        },

        unparse(node, pos, result) {
            let text = '';
            while (true) {
                if (!expr.unparse(node, pos, result)) break;

                // TODO: check if any input was consumed...
                // if not, stop iterating, since otherwise we may loop forever
                // TODO: any other checks needed? review...
                if (pos === result.posᐟ) break;
                text += result.text;
                pos = result.posᐟ;
            }

            result.text = text;
            result.posᐟ = pos;
            return true;
        },
    };
}
