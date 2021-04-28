// TODO: doc... has only 'ast' representation

function parseRecord(items: RecordItem[]) {
    const stateₒ = getState();
    const obj = {} as Record<string, unknown>;
    for (const item of items) {
        if (item.kind === 'RecordField') {
            let propName: string;
            if (typeof item.name === 'string') {
                // Statically-named field
                propName = item.name;
            }
            else {
                // Dynamically-named field
                if (!(item.name as Rule)()) return setState(stateₒ), false;
                assert(typeof OUT === 'string');
                propName = OUT;
            }
            if (!item.expr()) return setState(stateₒ), false;
            assert(OUT !== undefined);
            obj[propName] = OUT;
        }
        else /* item.kind === 'RecordSplice' */ {
            if (!item.expr()) return setState(stateₒ), false;
            assert(OUT && typeof OUT === 'object');
            Object.assign(obj, OUT);
        }
    }
    OUT = obj;
    return true;
}

function printRecord(items: RecordItem[]) {
    if (objectToString.call(IN) !== '[object Object]') return false;
    const stateₒ = getState();
    let text: unknown;

    const propNames = Object.keys(IN as any); // TODO: doc reliance on prop order and what this means
    const propCount = propNames.length;
    assert(propCount <= 32); // TODO: document this limit, move to constant, consider how to remove it

    // TODO: temp testing...
    const obj = IN as Record<string, unknown>;
    let bitmask = IP;

    // TODO: O(n^2)? Can we do better? More fast paths for common cases?
    outerLoop:
    for (const item of items) {
        if (item.kind === 'RecordField') {
            // Find the first property key/value pair that matches this field name/value pair (if any)
            for (let i = 0; i < propCount; ++i) {
                let propName = propNames[i];

                // TODO: skip already-consumed key/value pairs
                // tslint:disable-next-line: no-bitwise
                const propBit = 1 << i;
                // tslint:disable-next-line: no-bitwise
                if ((bitmask & propBit) !== 0) continue;

                // TODO: match field name
                if (typeof item.name !== 'string') {
                    // Dynamically-named field
                    setState({IN: propName, IP: 0});
                    if (!item.name()) continue;
                    if (IP !== propName.length) continue;
                    text = concat(text, OUT);
                }
                else {
                    // Statically-named field
                    if (propName !== item.name) continue;
                }

                // TODO: match field value
                setState({IN: obj[propName], IP: 0});
                if (!item.expr()) continue;
                if (!isInputFullyConsumed()) continue;
                text = concat(text, OUT);
        
                // TODO: we matched both name and value - consume them from `node`
                bitmask += propBit;
                continue outerLoop;
            }

            // If we get here, no match...
            setState(stateₒ);
            return false;
        }
        else /* item.kind === 'RecordSplice' */ {
            // TODO...
        }
    }
    setState({IN: obj, IP: bitmask});
    OUT = text;
    return true;
}

type RecordItem =
    | {kind: 'RecordField', name: string | Rule, expr: Rule}
    | {kind: 'RecordSplice', expr: Rule}
;
