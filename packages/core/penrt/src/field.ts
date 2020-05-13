// TODO: doc... has only 'ast' representation
function field(options: StaticOptions & {name: PenVal, value: PenVal}): PenVal {
    const {name, value} = options;
    return {
        parse() {
            let stateₒ = getState();
            let obj = {} as Record<string, unknown>;

            if (!name.parse()) return false;
            assert(typeof OUT === 'string');
            let propName = OUT;

            if (!value.parse()) return setState(stateₒ), false;
            assert(OUT !== undefined);
            obj[propName] = OUT;

            OUT = obj;
            return true;
        },

        unparse() {
            if (!isPlainObject(IN)) return false;
            let stateₒ = getState();
            let text: unknown;

            let propNames = Object.keys(IN); // TODO: doc reliance on prop order and what this means
            let propCount = propNames.length;
            assert(propCount <= 32); // TODO: document this limit, move to constant, consider how to remove it

            // TODO: temp testing...
            const obj = IN;
            let bitmask = IP;

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
                if (IP !== propName.length) continue;
                text = concat(text, OUT);

                // TODO: match field value
                setInState(obj[propName], 0);
                if (!value.unparse()) continue;
                if (!isFullyConsumed(obj[propName], IP)) continue;
                text = concat(text, OUT);

                // TODO: we matched both name and value - consume them from `node`
                bitmask += propBit;
                setInState(obj, bitmask);
                OUT = text;
                return true;
            }

            // If we get here, no match...
            setState(stateₒ);
            return false;
        },
    };
}
