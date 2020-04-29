function stringLiteral(value: string): PenVal {
    return {
        bindings: {},

        parse() {
            let {IDOC, IMEM, INUL, ONUL} = getState();
            if (!INUL) {
                if (!isString(IDOC)) return false;
                if (!matchesAt(IDOC, value, IMEM)) return false;
                setInState(IDOC, IMEM + value.length);
            }
            setOutState(ONUL ? undefined : value);
            return true;
        },

        unparse() {
            let {IDOC, IMEM, INUL, ONUL} = getState();
            if (!INUL) {
                if (!isString(IDOC)) return false;
                if (!matchesAt(IDOC, value, IMEM)) return false;
                setInState(IDOC, IMEM + value.length);
            }
            setOutState(ONUL ? undefined : value);
            return true;
        },

        apply: NOT_A_LAMBDA,
    };
}
