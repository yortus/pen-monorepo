const epsilon: Rule = {
    kind: 'rule',

    parse(_, pos, result) {
        result.node = undefined;
        result.posᐟ = pos;
        return true;
    },

    unparse(_, pos, result) {
        result.text = '';
        result.posᐟ = pos;
        return true;
    },
};
