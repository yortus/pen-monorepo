// TODO: doc... has only 'ast' representation
function record(options: StaticOptions & {fields: Array<{name: string, value: PenVal}>}): PenVal {
    const {fields} = options;
    return {
        parse() {
            let stateₒ = getState();
            let obj = {} as Record<string, unknown>;
            for (let field of fields) {
                let propName = field.name;
                if (!field.value.parse()) return setState(stateₒ), false;
                assert(ODOC !== undefined);
                obj[propName] = ODOC;
            }
            ODOC = obj;
            return true;
        },

        unparse() {
            if (!isPlainObject(IDOC)) return false;
            let stateₒ = getState();
            let text: unknown;

            let propNames = Object.keys(IDOC); // TODO: doc reliance on prop order and what this means
            let propCount = propNames.length;
            assert(propCount <= 32); // TODO: document this limit, move to constant, consider how to remove it

            // TODO: temp testing...
            const obj = IDOC;
            let bitmask = IMEM;

            for (let field of fields) {

                // Find the property key/value pair that matches this field name/value pair (if any)
                let i = propNames.indexOf(field.name);
                if (i < 0) return setState(stateₒ), false;
                let propName = propNames[i];

                // TODO: skip already-consumed key/value pairs
                // tslint:disable-next-line: no-bitwise
                const propBit = 1 << i;
                // tslint:disable-next-line: no-bitwise
                if ((bitmask & propBit) !== 0) return setState(stateₒ), false;

                // TODO: match field value
                setInState(obj[propName], 0);
                if (!field.value.unparse()) return setState(stateₒ), false;
                if (!isFullyConsumed(obj[propName], IMEM)) return setState(stateₒ), false;
                text = concat(text, ODOC);

                // TODO: we matched both name and value - consume them from `node`
                bitmask += propBit;
            }
            setInState(obj, bitmask);
            ODOC = text;
            return true;
        },
    };
}
