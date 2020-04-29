function booleanLiteral(value: boolean): PenVal {
    return {
        bindings: {},

        parse() {
            let {ONUL} = getState();
            setOutState(ONUL ? undefined : value);
            return true;
        },

        unparse() {
            let {IDOC, IMEM, INUL} = getState();
            if (!INUL) {
                if (IDOC !== value || IMEM !== 0) return false;
                setInState(IDOC, 1);
            }
            setOutState(undefined);
            return true;
        },

        apply: NOT_A_LAMBDA,
    };
}
