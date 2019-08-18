function Selection(...expressions: Relation[]): Relation {
    const arity = expressions.length;
    return {
        kind: 'Relation',
        parse: (src, pos, result) => {
            for (let i = 0; i < arity; ++i) {
                if (expressions[i].parse(src, pos, result)) return true;
            }
            return false;
        },
        unparse: (ast, pos, result) => {
            for (let i = 0; i < arity; ++i) {
                if (expressions[i].unparse(ast, pos, result)) return true;
            }
            return false;
        },
    };
}
