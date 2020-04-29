namespace sys {
    export const nullLiteral: PenVal = {
        bindings: {},

        parse() {
            let {ONUL} = getState();
            setOutState(ONUL ? undefined : null);
            return true;
        },

        unparse() {
            let {IDOC, IMEM, INUL} = getState();
            if (!INUL) {
                if (IDOC !== null || IMEM !== 0) return false;
                setInState(IDOC, 1);
            }
            setOutState(undefined);
            return true;
        },

        apply: NOT_A_LAMBDA,
    };
}
