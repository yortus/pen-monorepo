function createMainExports(createProgram: (options: StaticOptions) => PenVal) {
    const parse = createProgram({inForm: 'txt', outForm: 'ast'}).rule!;
    const print = createProgram({inForm: 'ast', outForm: 'txt'}).rule!;
    return {
        // TODO: dedupe the two fns below? Only the error strings differ.
        // TODO: add more exports - check, generate, etc.
        parse: (text: string) => {
            setState({IN: text, IP: 0});
            if (!parse()) throw new Error('parse failed');
            if (!isInputFullyConsumed()) throw new Error(`parse didn't consume entire input`);
            if (OUT === undefined) throw new Error(`parse didn't return a value`);
            return OUT;
        },
        print: (node: unknown) => {
            setState({IN: node, IP: 0});
            if (!print()) throw new Error('print failed');
            if (!isInputFullyConsumed()) throw new Error(`print didn't consume entire input`);
            if (OUT === undefined) throw new Error(`print didn't return a value`);
            return OUT;
        },
    };
}
