// TODO: investigate optimisations... Don't need to retain indirection in many cases. Or will V8 optimisations suffice?
function reference(target: Production): Production {
    return {
        kind: 'production',

        parse(text, pos, result) {
            return target.parse(text, pos, result);
        },

        unparse(node, pos, result) {
            return target.unparse(node, pos, result);
        },
    };
}
