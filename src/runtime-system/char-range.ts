function charRange(min: string, max: string): Production {
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
