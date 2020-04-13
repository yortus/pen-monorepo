function createMainExports(start: Rule) {
    return {
        parse: (text: string) => {
            setInState(text, 0);
            if (!start.parse()) throw new Error('parse failed');
            if (!isFullyConsumed(IBUF, IPTR)) throw new Error(`parse didn't consume entire input`);
            if (OUT === undefined) throw new Error(`parse didn't return a value`);
            return OUT;
        },
        unparse: (node: unknown) => {
            setInState(node, 0);
            if (!start.unparse()) throw new Error('parse failed');
            if (!isFullyConsumed(IBUF, IPTR)) throw new Error(`unparse didn't consume entire input`);
            if (OUT === undefined) throw new Error(`parse didn't return a value`);
            return OUT;
        },
    };
}
