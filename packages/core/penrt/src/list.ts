// TODO: doc... has only 'ast' representation

function parseList(items: ListItem[]) {
    const itemsLength = items.length;
    const stateₒ = getState();
    const arr = [] as unknown[];
    for (let i = 0; i < itemsLength; ++i) {
        const item = items[i];
        if (item.kind === 'Element') {
            if (!item.expr()) return setState(stateₒ), false;
            assert(OUT !== undefined);
            arr.push(OUT);
        }
        else /* item.kind === 'Splice' */ {
            // TODO: implement...
            throw new Error('Not implemented!');
        }
    }
    OUT = arr;
    return true;
}

function printList(items: ListItem[]) {
    const itemsLength = items.length;
    if (!Array.isArray(IN)) return false;
    // TODO: was... remove? if (IP < 0 || IP + elementsLength > IN.length) return false;

    const stateₒ = getState();
    let text: unknown;
    const arr = IN;
    const off = IP;
    for (let i = 0; i < itemsLength; ++i) {
        const item = items[i];
        if (item.kind === 'Element') {
            // TODO: buggy
            // BUG: wrong if splices are present
            setState({IN: arr[off + i], IP: 0});
            if (!item.expr()) return setState(stateₒ), false;
            if (!isInputFullyConsumed()) return setState(stateₒ), false;
            text = concat(text, OUT);
        }
        else /* item.kind === 'Splice' */ {
            // TODO: implement...
            throw new Error('Not implemented!');
        }
    }

    // TODO: buggy
    // BUG: wrong if splices are present
    setState({IN: arr, IP: off + itemsLength});

    OUT = text;
    return true;
}

type ListItem =
    | {kind: 'Element', expr: Rule}
    | {kind: 'Splice', expr: Rule}
;
