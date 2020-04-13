function selection(...expressions: Rule[]): Rule {
    const arity = expressions.length;
    return {
        kind: 'rule',

        parse() {
            for (let i = 0; i < arity; ++i) {
                if (expressions[i].parse()) return true;
            }
            return false;
        },

        unparse() {
            for (let i = 0; i < arity; ++i) {
                if (expressions[i].unparse()) return true;
            }
            return false;
        },
    };
}
