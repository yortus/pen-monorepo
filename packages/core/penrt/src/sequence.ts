function sequence(options: StaticOptions & {expressions: PenVal[]}): PenVal {
    const {expressions} = options;
    const arity = expressions.length;
    return {
        bindings: {},

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

        apply: NOT_A_LAMBDA,
    };
}
