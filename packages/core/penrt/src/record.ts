// TODO: doc... has only 'ast' representation
function record({mode, fields}: StaticOptions & {fields: Array<{name: string, value: Rule}>}): Rule {

    if (isParse(mode)) {
        return function RCD() {
            let stateₒ = getState();
            let obj = {} as Record<string, unknown>;
            for (let field of fields) {
                let propName = field.name;
                if (!field.value()) return setState(stateₒ), false;
                assert(OUT !== undefined);
                obj[propName] = OUT;
            }
            OUT = obj;
            return true;
        };
    }

    else /* isPrint */ {
        return function RCD() {
            if (objectToString.call(IN) !== '[object Object]') return false;
            let stateₒ = getState();
            let text: unknown;

            let propNames = Object.keys(IN as any); // TODO: doc reliance on prop order and what this means
            let propCount = propNames.length;
            assert(propCount <= 32); // TODO: document this limit, move to constant, consider how to remove it

            // TODO: temp testing...
            const obj = IN as Record<string, unknown>;
            let bitmask = IP;

            for (let field of fields) {

                // Find the property key/value pair that matches this field name/value pair (if any)
                let i = propNames.indexOf(field.name);
                if (i < 0) return setState(stateₒ), false;
                let propName = propNames[i];

                // TODO: skip already-consumed key/value pairs
                const propBit = 1 << i;
                if ((bitmask & propBit) !== 0) return setState(stateₒ), false;

                // TODO: match field value
                setState({IN: obj[propName], IP: 0});
                if (!field.value()) return setState(stateₒ), false;
                if (!isInputFullyConsumed()) return setState(stateₒ), false;
                text = concat(text, OUT);

                // TODO: we matched both name and value - consume them from `node`
                bitmask += propBit;
            }
            setState({IN: obj, IP: bitmask});
            OUT = text;
            return true;
        };
    }
}
