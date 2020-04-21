function createMainExports(start: PenVal) {
    return {
        parse: (text: string) => {
            setInState(text, 0);
            if (!start.parse()) throw new Error('parse failed');
            if (!isFullyConsumed(IDOC, IMEM)) throw new Error(`parse didn't consume entire input`);
            if (ODOC === undefined) throw new Error(`parse didn't return a value`);
            return ODOC;
        },
        unparse: (node: unknown) => {
            setInState(node, 0);
            if (!start.unparse()) throw new Error('parse failed');
            if (!isFullyConsumed(IDOC, IMEM)) throw new Error(`unparse didn't consume entire input`);
            if (ODOC === undefined) throw new Error(`parse didn't return a value`);
            return ODOC;
        },
    };
}
