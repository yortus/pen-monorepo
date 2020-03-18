function string(value: string): Production {
    return {
        kind: 'production',

        parse(text, pos, result) {
            if (!matchesAt(text, value, pos)) return false;
            result.node = value;
            result.posᐟ = pos + value.length;
            return true;
        },

        unparse(node, pos, result) {
            if (typeof node !== 'string' || !matchesAt(node, value, pos)) return false;
            result.text = value;
            result.posᐟ = pos + value.length;
            return true;
        },
    };
}
