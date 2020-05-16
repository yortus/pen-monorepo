// TODO: doc... has only 'ast' representation
function list(options: StaticOptions & {elements: PenVal[]}): PenVal {
    const {elements} = options;
    const elementsLength = elements.length;

    if (options.in === 'txt' || options.out === 'ast') {
        return {
            rule: function LST() {
                let stateₒ = getState();
                let arr = [] as unknown[];
                for (let i = 0; i < elementsLength; ++i) {
                    if (!elements[i].rule!()) return setState(stateₒ), false;
                    assert(OUT !== undefined);
                    arr.push(OUT);
                }
                OUT = arr;
                return true;
            },
        };
    }

    if (options.in === 'ast' || options.out === 'txt') {
        return {
            rule: function LST() {
                if (!Array.isArray(IN)) return false;
                if (IP < 0 || IP + elementsLength > IN.length) return false;

                let stateₒ = getState();
                let text: unknown;
                const arr = IN;
                const off = IP;
                for (let i = 0; i < elementsLength; ++i) {
                    setState({IN: arr[off + i], IP: 0});
                    if (!elements[i].rule!()) return setState(stateₒ), false;
                    if (!isInputFullyConsumed()) return setState(stateₒ), false;
                    text = concat(text, OUT);
                }
                setState({IN: arr, IP: off + elementsLength});
                OUT = text;
                return true;
            },
        };
    }

    throw new Error(`Unsupported operation '${options.in}'->'${options.out}'`);
}
