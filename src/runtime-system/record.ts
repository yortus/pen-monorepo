type Field =
    | {dynamic: false, name: string, value: Rule}
    | {dynamic: true, name: Rule, value: Rule};


function record(fields: Field[]): Rule {
    return {
        kind: 'rule',

        parse() {
            let stateₒ = getState();
            let obj = {} as Record<string, unknown>;
            for (let field of fields) {
                let propName: string;
                if (field.dynamic) {
                    if (!field.name.parse()) return setState(stateₒ), false;
                    assert(typeof OUT === 'string');
                    propName = OUT;
                }
                else /* field.dynamic === false */ {
                    propName = field.name;
                }

                if (!field.value.parse()) return setState(stateₒ), false;
                assert(OUT !== undefined);
                obj[propName] = OUT;
            }
            OUT = obj;
            return true;
        },

        unparse() {
            let stateₒ = getState();
            let text = '';
            if (!isPlainObject(IBUF)) return false;

            let propNames = Object.keys(IBUF); // TODO: doc reliance on prop order and what this means
            let propCount = propNames.length;
            assert(propCount <= 32); // TODO: document this limit, move to constant, consider how to remove it


            // TODO: temp testing...
            const obj = IBUF;
            let bitmask = IPTR;

            // TODO: O(n^2)? Can we do better? More fast paths for common cases?
            outerLoop:
            for (let field of fields) {

                // Find the first property key/value pair that matches this field name/value pair (if any)
                for (let i = 0; i < propCount; ++i) {
                    let propName = propNames[i];

                    // TODO: skip already-consumed key/value pairs
                    // tslint:disable-next-line: no-bitwise
                    const propBit = 1 << i;
                    // tslint:disable-next-line: no-bitwise
                    if ((bitmask & propBit) !== 0) continue;

                    // TODO: match field name
                    if (field.dynamic) {
                        setInState(propName, 0);
                        if (!field.name.unparse()) continue;
                        if (IPTR !== propName.length) continue;
                        text += OUT;
                    }
                    else /* field.dynamic === false */ {
                        if (propName !== field.name) continue;
                    }

                    // TODO: match field value
                    setInState(obj[propName], 0);
                    if (!field.value.unparse()) continue;
                    if (!isFullyConsumed(obj[propName], IPTR)) continue;
                    text += OUT;

                    // TODO: we matched both name and value - consume them from `node`
                    bitmask += propBit;
                    continue outerLoop;
                }

                // If we get here, no match...
                setState(stateₒ);
                return false;
            }
            setInState(obj, bitmask);
            OUT = text;
            return true;
        },
    };
}
