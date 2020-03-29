function maybe(expr: Rule): Rule {
    return {
        kind: 'rule',

        parse(text, pos, result) {
            if (expr.parse(text, pos, result)) return true;
            return epsilon.parse(text, pos, result);
        },

        unparse(node, pos, result) {
            if (expr.unparse(node, pos, result)) return true;
            return epsilon.unparse(node, pos, result);
        },
    };
}
