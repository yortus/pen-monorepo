const anyChar: Rule = {
    kind: 'rule',

    parse(text, pos, result) {
        if (pos >= text.length) return false;
        result.node = text.charAt(pos);
        result.posᐟ = pos + 1;
        return true;
    },

    unparse(node, pos, result) {
        if (typeof node !== 'string' || pos >= node.length) return false;
        result.text = node.charAt(pos);
        result.posᐟ = pos + 1;
        return true;
    },
};
