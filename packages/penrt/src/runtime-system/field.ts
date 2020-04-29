function field(name: PenVal, value: PenVal): PenVal {
    return {
        bindings: {},

        parse() {
            let stateₒ = getState();
            let obj = {} as Record<string, unknown>;

            if (!name.parse()) return setState(stateₒ), false;
            let {ODOC} = getState();
            assert(typeof ODOC === 'string');
            let propName = ODOC;

            if (!value.parse()) return setState(stateₒ), false;
            ({ODOC} = getState());
            assert(ODOC !== undefined);
            obj[propName] = ODOC;

            setOutState(obj);
            return true;
        },

        unparse() {
            let stateₒ = getState();
            let text: unknown;
            if (!isPlainObject(stateₒ.IDOC)) return false;

            let propNames = Object.keys(stateₒ.IDOC); // TODO: doc reliance on prop order and what this means
            let propCount = propNames.length;
            assert(propCount <= 32); // TODO: document this limit, move to constant, consider how to remove it

            // TODO: temp testing...
            const obj = stateₒ.IDOC;
            let bitmask = stateₒ.IMEM;

            // Find the first property key/value pair that matches this field name/value pair (if any)
            for (let i = 0; i < propCount; ++i) {
                let propName = propNames[i];

                // TODO: skip already-consumed key/value pairs
                // tslint:disable-next-line: no-bitwise
                const propBit = 1 << i;
                // tslint:disable-next-line: no-bitwise
                if ((bitmask & propBit) !== 0) continue;

                // TODO: match field name
                setInState(propName, 0);
                if (!name.unparse()) continue;
                let {IMEM, ODOC} = getState();
                if (IMEM !== propName.length) continue;
                text = concat(text, ODOC);

                // TODO: match field value
                setInState(obj[propName], 0);
                if (!value.unparse()) continue;
                ({IMEM, ODOC} = getState());
                if (!isFullyConsumed(obj[propName], IMEM)) continue;
                text = concat(text, ODOC);

                // TODO: we matched both name and value - consume them from `node`
                bitmask += propBit;
                setInState(obj, bitmask);
                setOutState(text);
                return true;
            }

            // If we get here, no match...
            setState(stateₒ);
            return false;
        },

        apply: NOT_A_LAMBDA,
    };
}
