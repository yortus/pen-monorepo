function string(value: string, modifier?: 'concrete' | 'abstract'): Production {
    if (modifier === 'abstract') {
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

    if (modifier === 'concrete') {
        return {
            kind: 'production',
            parse(text, pos, result) {
                if (!matchesAt(text, value, pos)) return false;
                result.node = undefined;
                result.posᐟ = pos + value.length;
                return true;
            },
            unparse(_, pos, result) {
                result.text = value;
                result.posᐟ = pos;
                return true;
            },
        };
    }

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
