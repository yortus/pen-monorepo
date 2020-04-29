function character(min: string, max: string): PenVal {
    return {
        bindings: {},

        parse() {
            let {IDOC, IMEM, INUL, ONUL} = getState();
            let c = min;
            if (!INUL) {
                if (!isString(IDOC)) return false;
                if (IMEM < 0 || IMEM >= IDOC.length) return false;
                c = IDOC.charAt(IMEM);
                if (c < min || c > max) return false;
                setInState(IDOC, IMEM + 1);
            }
            setOutState(ONUL ? undefined : c);
            return true;
        },

        unparse() {
            let {IDOC, IMEM, INUL, ONUL} = getState();
            let c = min;
            if (!INUL) {
                if (!isString(IDOC)) return false;
                if (IMEM < 0 || IMEM >= IDOC.length) return false;
                c = IDOC.charAt(IMEM);
                if (c < min || c > max) return false;
                setInState(IDOC, IMEM + 1);
            }
            setOutState(ONUL ? undefined : c);
            return true;
        },

        apply: NOT_A_LAMBDA,
    };
}
