function character(min: string, max: string, modifier?: 'concrete' | 'abstract'): Production {
    if (modifier === 'abstract') {
        return {
            kind: 'production',
            parse(_, pos, result) {
                result.node = min;
                result.posᐟ = pos;
                return true;
            },
            unparse(node, pos, result) {
                if (typeof node !== 'string' || pos >= node.length) return false;
                let c = node.charAt(pos);
                if (c < min || c > max) return false;
                result.text = '';
                result.posᐟ = pos + 1;
                return true;
            },
        };
    }

    if (modifier === 'concrete') {
        return {
            kind: 'production',
            parse(text, pos, result) {
                if (pos >= text.length) return false;
                let c = text.charAt(pos);
                if (c < min || c > max) return false;
                result.node = undefined;
                result.posᐟ = pos + 1;
                return true;
            },
            unparse(_, pos, result) {
                result.text = min;
                result.posᐟ = pos;
                return true;
            },
        };
    }

    return {
        kind: 'production',
        parse(text, pos, result) {
            if (pos >= text.length) return false;
            let c = text.charAt(pos);
            if (c < min || c > max) return false;
            result.node = c;
            result.posᐟ = pos + 1;
            return true;
        },
        unparse(node, pos, result) {
            if (typeof node !== 'string' || pos >= node.length) return false;
            let c = node.charAt(pos);
            if (c < min || c > max) return false;
            result.text = c;
            result.posᐟ = pos + 1;
            return true;
        },
    };
}
