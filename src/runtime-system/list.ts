function list(elements: Rule[]): Rule {
    const elementsLength = elements.length;
    return {
        kind: 'rule',

        parse() {
            let stateₒ = getState();
            let arr = [] as unknown[];
            for (let i = 0; i < elementsLength; ++i) {
                if (!elements[i].parse()) return setState(stateₒ), false;
                assert(OUT !== undefined);
                arr.push(OUT);
            }
            OUT = arr;
            return true;
        },

        unparse() {
            let stateₒ = getState();
            let text = '';
            if (!Array.isArray(IBUF)) return false;
            if (IPTR < 0 || IPTR + elementsLength >= IBUF.length) return false;
            const arr = IBUF;
            const off = IPTR;
            for (let i = 0; i < elementsLength; ++i) {
                setInState(arr[off + i], 0);
                if (!elements[i].unparse()) return setState(stateₒ), false;
                if (!isFullyConsumed(IBUF, IPTR)) return setState(stateₒ), false;
                text += OUT;
            }
            setInState(arr, off + elementsLength);
            OUT = text;
            return true;
        },
    };
}
