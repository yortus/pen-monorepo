function list(elements: Rule[]): Rule {
    const elementsLength = elements.length;
    return {
        kind: 'rule',

        parse() {
            let stateₒ = getState();
            let arr = [] as unknown[];
            for (let i = 0; i < elementsLength; ++i) {
                if (!elements[i].parse()) return setState(stateₒ), false;
                assert(ODOC !== undefined);
                arr.push(ODOC);
            }
            ODOC = arr;
            return true;
        },

        unparse() {
            let stateₒ = getState();
            let text = '';
            if (!Array.isArray(IDOC)) return false;
            if (IMEM < 0 || IMEM + elementsLength >= IDOC.length) return false;
            const arr = IDOC;
            const off = IMEM;
            for (let i = 0; i < elementsLength; ++i) {
                setInState(arr[off + i], 0);
                if (!elements[i].unparse()) return setState(stateₒ), false;
                if (!isFullyConsumed(IDOC, IMEM)) return setState(stateₒ), false;
                text += ODOC;
            }
            setInState(arr, off + elementsLength);
            ODOC = text;
            return true;
        },
    };
}
