const intrinsicTrue: Rule = {
    kind: 'rule',

    parse(_, pos, result) {
        result.node = true;
        result.posᐟ = pos;
        return true;
    },

    unparse(node, pos, result) {
        if (node !== true || pos !== 0) return false;
        result.text = '';
        result.posᐟ = 1;
        return true;
    },
};
