function createMainExports(createProgram: (options: StaticOptions) => PenVal) {
    const parse = createProgram({in: 'txt', out: 'ast'}).parse;
    const unparse = createProgram({in: 'ast', out: 'txt'}).unparse;
    return {
        parse: (text: string) => {
            setState({IN: text, IP: 0});
            if (!parse()) throw new Error('parse failed');
            if (!isInputFullyConsumed()) throw new Error(`parse didn't consume entire input`);
            if (OUT === undefined) throw new Error(`parse didn't return a value`);
            return OUT;
        },
        unparse: (node: unknown) => {
            setState({IN: node, IP: 0});
            if (!unparse()) throw new Error('parse failed');
            if (!isInputFullyConsumed()) throw new Error(`unparse didn't consume entire input`);
            if (OUT === undefined) throw new Error(`parse didn't return a value`);
            return OUT;
        },
    };
}
