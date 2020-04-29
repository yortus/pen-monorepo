function list(elements: PenVal[]): PenVal {
    const elementsLength = elements.length;
    return {
        bindings: {},

        parse() {
            let stateₒ = getState();
            let arr = [] as unknown[];
            for (let i = 0; i < elementsLength; ++i) {
                if (!elements[i].parse()) return setState(stateₒ), false;
                let {ODOC} = getState();
                assert(ODOC !== undefined);
                arr.push(ODOC);
            }
            setOutState(arr);
            return true;
        },

        unparse() {
            let stateₒ = getState();
            let text: unknown;
            if (!Array.isArray(stateₒ.IDOC)) return false;
            if (stateₒ.IMEM < 0 || stateₒ.IMEM + elementsLength > stateₒ.IDOC.length) return false;
            const arr = stateₒ.IDOC;
            const off = stateₒ.IMEM;
            for (let i = 0; i < elementsLength; ++i) {
                setInState(arr[off + i], 0);
                if (!elements[i].unparse()) return setState(stateₒ), false;
                let {IDOC, IMEM, ODOC} = getState();
                if (!isFullyConsumed(IDOC, IMEM)) return setState(stateₒ), false;
                text = concat(text, ODOC);
            }
            setInState(arr, off + elementsLength);
            setOutState(text);
            return true;
        },

        apply: NOT_A_LAMBDA,
    };
}
