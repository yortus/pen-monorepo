interface Relation {
    kind: 'Relation',
    parse(src: string, pos: number, result: {ast: unknown, posᐟ: number}): boolean;
    unparse(ast: unknown, pos: number, result: {src: string, posᐟ: number}): boolean;

    // TODO: temp testing... for namespaces
    exports?: Record<string, unknown>;
}
