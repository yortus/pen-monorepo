function createMainExports(start: Rule) {
    return {
        parse: (text: string) => {
            let result = {node: null, posᐟ: 0};
            if (!start.parse(text, 0, result)) throw new Error('parse failed');
            if (result.posᐟ !== text.length) throw new Error(`parse didn't consume entire input`);
            if (result.node === undefined) throw new Error(`parse didn't return a value`);
            return result.node;
        },
        unparse: (node: unknown) => {
            let result = {text: '', posᐟ: 0};
            if (!start.unparse(node, 0, result)) throw new Error('parse failed');
            if (!isFullyConsumed(node, result.posᐟ)) throw new Error(`unparse didn't consume entire input`);
            return result.text;
        },
    };
}
