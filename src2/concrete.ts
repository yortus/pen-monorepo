namespace sys {
    export function concrete(expr: PenVal): PenVal {
        return {
            bindings: {},

            parse() {
                let state = getState();
                let ONULₒ = state.ONUL;
                state.ONUL = true;
                setState(state);
                let result = expr.parse();
                state = getState();
                state.ONUL = ONULₒ;
                setState(state);
                return result;
            },

            unparse() {
                let state = getState();
                let INULₒ = state.INUL;
                state.INUL = true;
                setState(state);
                let result = expr.unparse();
                state = getState();
                state.INUL = INULₒ;
                setState(state);
                return result;
            },

            apply: NOT_A_LAMBDA,
        };
    }
}
