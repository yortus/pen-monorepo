// TODO: doc... has only 'ast' representation

function parseList(elements: Rule[]) {
    const elementsLength = elements.length;
    let stateₒ = getState();
    let arr = [] as unknown[];
    for (let i = 0; i < elementsLength; ++i) {
        if (!elements[i]()) return setState(stateₒ), false;
        assert(OUT !== undefined);
        arr.push(OUT);
    }
    OUT = arr;
    return true;
}

function printList(elements: Rule[]) {
    const elementsLength = elements.length;
    if (!Array.isArray(IN)) return false;
    if (IP < 0 || IP + elementsLength > IN.length) return false;

    let stateₒ = getState();
    let text: unknown;
    const arr = IN;
    const off = IP;
    for (let i = 0; i < elementsLength; ++i) {
        setState({IN: arr[off + i], IP: 0});
        if (!elements[i]()) return setState(stateₒ), false;
        if (!isInputFullyConsumed()) return setState(stateₒ), false;
        text = concat(text, OUT);
    }
    setState({IN: arr, IP: off + elementsLength});
    OUT = text;
    return true;
}
