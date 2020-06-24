// TODO: doc... has only 'ast' representation
function field({mode, name, value}: StaticOptions & {name: Rule, value: Rule}): Rule {
    if (isParse(mode)) {
        return function FLD() {
            let stateₒ = getState();
            let obj = {} as Record<string, unknown>;

            if (!name()) return false;
            assert(typeof OUT === 'string');
            let propName = OUT;

            if (!value()) return setState(stateₒ), false;
            assert(OUT !== undefined);
            obj[propName] = OUT;

            OUT = obj;
            return true;
        };
    }

    else /* isPrint */ {
        return function FLD() {
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
                const propBit = 1 << i;
                if ((bitmask & propBit) !== 0) continue;

                // TODO: match field name
                setState({IN: propName, IP: 0});
                if (!name()) continue;
                if (IP !== propName.length) continue;
                text = concat(text, OUT);

                // TODO: match field value
                setState({IN: obj[propName], IP: 0});
                if (!value()) continue;
                if (!isInputFullyConsumed()) continue;
                text = concat(text, OUT);

                // TODO: we matched both name and value - consume them from `node`
                bitmask += propBit;
                setState({IN: obj, IP: bitmask});
                OUT = text;
                return true;
            }

            // If we get here, no match...
            setState(stateₒ);
            return false;
        };
    }
}
