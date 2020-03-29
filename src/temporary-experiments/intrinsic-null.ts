const intrinsicNull: Rule = {
    kind: 'rule',

    parse(_, pos, result) {
        result.node = null;
        result.posᐟ = pos;
        return true;
    },

    unparse(node, pos, result) {
        if (node !== null || pos !== 0) return false;
        result.text = '';
        result.posᐟ = 1;
        return true;
    },
};
