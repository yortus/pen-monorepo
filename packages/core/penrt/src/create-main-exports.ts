function createMainExports(createProgram: (options: StaticOptions) => PenVal) {
    const parse = createProgram({in: 'txt', out: 'ast'}).parse;
    const unparse = createProgram({in: 'ast', out: 'txt'}).unparse;
    return {
        parse: (text: string) => {
            setInState(text, 0);
            if (!parse()) throw new Error('parse failed');
            if (!isFullyConsumed(IDOC, IMEM)) throw new Error(`parse didn't consume entire input`);
            if (ODOC === undefined) throw new Error(`parse didn't return a value`);
            return ODOC;
        },
        unparse: (node: unknown) => {
            setInState(node, 0);
            if (!unparse()) throw new Error('parse failed');
            if (!isFullyConsumed(IDOC, IMEM)) throw new Error(`unparse didn't consume entire input`);
            if (ODOC === undefined) throw new Error(`parse didn't return a value`);
            return ODOC;
        },
    };
}
