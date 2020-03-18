function label(value: string): Production {
    return {
        kind: 'production',

        parse(_, pos, result) {
                result.node = value;
                result.posᐟ = pos;
                return true;
        },

        unparse(node, pos, result) {
            if (typeof node !== 'string' || !matchesAt(node, value, pos)) return false;
            result.text = '';
            result.posᐟ = pos + value.length;
            return true;
        },
    };
}
