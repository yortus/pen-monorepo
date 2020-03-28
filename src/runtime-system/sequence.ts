function sequence(...expressions: Rule[]): Rule {
    const arity = expressions.length;
    return {
        kind: 'rule',

        parse(text, pos, result) {
            let node: unknown;
            for (let i = 0; i < arity; ++i) {
                if (!expressions[i].parse(text, pos, result)) return false;
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
            for (let i = 0; i < arity; ++i) {
                if (!expressions[i].unparse(node, pos, result)) return false;
                // TODO: more sanity checking in here, like for parse...
                text += result.text;
                pos = result.posᐟ;
            }
            result.text = text;
            result.posᐟ = pos;
            return true;
        },
    };
}
