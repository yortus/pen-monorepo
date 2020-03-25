// TODO: investigate optimisations... Don't need to retain indirection in many cases. Or will V8 optimisations suffice?
function reference(target: Datatype): Datatype {

    // TODO: hacky and repetitive, fix this. Prob: if its a forward ref, we don't know target type yet.
    if (target.kind === 'production') {
        return {
            kind: 'production',
            parse: (text, pos, result) => target.parse(text, pos, result),
            unparse: (node, pos, result) => target.unparse(node, pos, result),
        };
    }
    else if (target.kind === 'function') {
        return {
            kind: 'function',
            apply: (arg) => target.apply(arg),
        };
    }
    else {
        throw new Error('Not implemented'); // TODO: ...
    }


}
