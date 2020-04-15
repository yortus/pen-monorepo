function sequence(...expressions: Rule[]): Rule {
    const arity = expressions.length;
    return {
        kind: 'rule',

        parse() {
            let stateₒ = getState();
            let node: unknown;
            for (let i = 0; i < arity; ++i) {
                if (!expressions[i].parse()) return setState(stateₒ), false;
                node = concat(node, ODOC);
            }
            ODOC = node;
            return true;
        },

        unparse() {
            let stateₒ = getState();
            let text: unknown;
            for (let i = 0; i < arity; ++i) {
                if (!expressions[i].unparse()) return setState(stateₒ), false;
                text = concat(text, ODOC);
            }
            ODOC = text;
            return true;
        },
    };
}
