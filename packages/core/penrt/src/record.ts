// TODO: doc... has only 'ast' representation
function record(options: StaticOptions & {fields: Array<{name: string, value: PenVal}>}): PenVal {
    const {fields} = options;

    if (options.in === 'txt' || options.out === 'ast') {
        return {
            rule: function RCD() {
                let stateₒ = getState();
                let obj = {} as Record<string, unknown>;
                for (let field of fields) {
                    let propName = field.name;
                    if (!field.value.rule!()) return setState(stateₒ), false;
                    assert(OUT !== undefined);
                    obj[propName] = OUT;
                }
                OUT = obj;
                return true;
            },
        };
    }

    if (options.in === 'ast' || options.out === 'txt') {
        return {
            rule: function RCD() {
                if (!isPlainObject(IN)) return false;
                let stateₒ = getState();
                let text: unknown;

                let propNames = Object.keys(IN); // TODO: doc reliance on prop order and what this means
                let propCount = propNames.length;
                assert(propCount <= 32); // TODO: document this limit, move to constant, consider how to remove it

                // TODO: temp testing...
                const obj = IN;
                let bitmask = IP;

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
                    setState({IN: obj[propName], IP: 0});
                    if (!field.value.rule!()) return setState(stateₒ), false;
                    if (!isInputFullyConsumed()) return setState(stateₒ), false;
                    text = concat(text, OUT);

                    // TODO: we matched both name and value - consume them from `node`
                    bitmask += propBit;
                }
                setState({IN: obj, IP: bitmask});
                OUT = text;
                return true;
            },
        };
    }

    throw new Error(`Unsupported operation '${options.in}'->'${options.out}'`);
}
