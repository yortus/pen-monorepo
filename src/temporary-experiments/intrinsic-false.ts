const intrinsicFalse: Rule = {
    kind: 'rule',

    parse(_, pos, result) {
        result.node = false;
        result.posᐟ = pos;
        return true;
    },

    unparse(node, pos, result) {
        if (node !== false || pos !== 0) return false;
        result.text = '';
        result.posᐟ = 1;
        return true;
    },
};
