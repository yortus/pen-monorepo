const textOnly: Function_ = {
    kind: 'function',
    apply(expr: Production): Production {
        return {
            kind: 'production',

            parse(text, pos, result) {
                let success = expr.parse(text, pos, result);
                if (success) result.node = undefined;
                return success;
            },

            unparse(_node, _pos, _result) {
                throw new Error('Not implemented');
            },
        };
    },
};
