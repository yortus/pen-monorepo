// TODO: doc... this rule is representation-agnostic
function selection(options: StaticOptions & {expressions: PenVal[]}): PenVal {
    const {expressions} = options;
    const arity = expressions.length;
    return {
        rule() {
            for (let i = 0; i < arity; ++i) {
                if (expressions[i].rule!()) return true;
            }
            return false;
        },
    };
}
