namespace sys {
    export function sequence(...expressions: PenVal[]): PenVal {
        const arity = expressions.length;
        return {
            bindings: {},

            parse() {
                let stateₒ = getState();
                let node: unknown;
                for (let i = 0; i < arity; ++i) {
                    if (!expressions[i].parse()) return setState(stateₒ), false;
                    let {ODOC} = getState();
                    node = concat(node, ODOC);
                }
                setOutState(node);
                return true;
            },

            unparse() {
                let stateₒ = getState();
                let text: unknown;
                for (let i = 0; i < arity; ++i) {
                    if (!expressions[i].unparse()) return setState(stateₒ), false;
                    let {ODOC} = getState();
                    text = concat(text, ODOC);
                }
                setOutState(text);
                return true;
            },

            apply: NOT_A_LAMBDA,
        };
    }
}
