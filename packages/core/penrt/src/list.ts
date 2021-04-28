// TODO: doc... has only 'ast' representation

function parseList(items: ListItem[]) {
    const itemsLength = items.length;
    const stateₒ = getState();
    const arr = [] as unknown[];
    for (let i = 0; i < itemsLength; ++i) {
        const item = items[i];
        if (item.kind === 'ListElement') {
            if (!item.expr()) return setState(stateₒ), false;
            assert(OUT !== undefined);
            arr.push(OUT);
        }
        else /* item.kind === 'ListSplice' */ {
            if (!item.expr()) return setState(stateₒ), false;
            assert(Array.isArray(OUT));
            arr.push(...OUT);
        }
    }
    OUT = arr;
    return true;
}

function printList(items: ListItem[]) {
    const itemsLength = items.length;
    if (!Array.isArray(IN)) return false;
    const stateₒ = getState();
    let text: unknown;
    const arr = IN;
    let off = IP;
    for (let i = 0; i < itemsLength; ++i) {
        const item = items[i];
        if (item.kind === 'ListElement') {
            setState({IN: arr[off], IP: 0});
            if (!item.expr()) return setState(stateₒ), false;
            if (!isInputFullyConsumed()) return setState(stateₒ), false;
            text = concat(text, OUT);
            off += 1;
        }
        else /* item.kind === 'ListSplice' */ {
            setState({IN: arr, IP: off});
            if (!item.expr()) return setState(stateₒ), false;
            text = concat(text, OUT);
            off = IP;
        }
    }
    setState({IN: arr, IP: off});
    OUT = text;
    return true;
}

type ListItem =
    | {kind: 'ListElement', expr: Rule}
    | {kind: 'ListSplice', expr: Rule}
;
