// TODO: doc... has only 'ast' representation

function parseList(listItems: ListItem[]) {
    const itemCount = listItems.length;
    return function LST() {
        const stateₒ = getState();
        const arr = [] as unknown[];
        for (let i = 0; i < itemCount; ++i) {
            const listItem = listItems[i];
            if (listItem.kind === 'Element') {
                if (!listItem.expr()) return setState(stateₒ), false;
                assert(OUT !== undefined);
                arr.push(OUT);
            }
            else /* item.kind === 'Splice' */ {
                if (!listItem.expr()) return setState(stateₒ), false;
                assert(Array.isArray(OUT));
                arr.push(...OUT);
            }
        }
        OUT = arr;
        return true;
    };
}

function printList(listItems: ListItem[]) {
    const itemCount = listItems.length;
    return function LST() {
        if (!Array.isArray(IN)) return false;
        const stateₒ = getState();
        let text: unknown;
        const arr = IN;
        let off = IP;
        for (let i = 0; i < itemCount; ++i) {
            const listItem = listItems[i];
            if (listItem.kind === 'Element') {
                setState({IN: arr[off], IP: 0});
                if (!listItem.expr()) return setState(stateₒ), false;
                if (!isInputFullyConsumed()) return setState(stateₒ), false;
                text = concat(text, OUT);
                off += 1;
            }
            else /* item.kind === 'Splice' */ {
                setState({IN: arr, IP: off});
                if (!listItem.expr()) return setState(stateₒ), false;
                text = concat(text, OUT);
                off = IP;
            }
        }
        setState({IN: arr, IP: off});
        OUT = text;
        return true;
    };
}

type ListItem =
    | {kind: 'Element', expr: Rule}
    | {kind: 'Splice', expr: Rule}
;
