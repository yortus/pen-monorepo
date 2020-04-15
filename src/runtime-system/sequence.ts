function sequence(...expressions: Rule[]): Rule {
    const arity = expressions.length;
    return {
        kind: 'rule',

        parse() {
            let stateₒ = getState();
            let node: unknown;
            for (let i = 0; i < arity; ++i) {
                if (!expressions[i].parse()) return setState(stateₒ), false;
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
            let stateₒ = getState();
            let text = '';
            for (let i = 0; i < arity; ++i) {
                if (!expressions[i].unparse()) return setState(stateₒ), false;
                // TODO: support more formats / blob types here, like for parse...
                assert(typeof ODOC === 'string'); // just for now... remove after addressing above TODO
                text += ODOC;
            }
            ODOC = text;
            return true;
        },
    };
}
