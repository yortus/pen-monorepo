// TODO: doc... this rule is representation-agnostic
function selection(options: StaticOptions & {expressions: Rule[]}): Rule {
    const {expressions} = options;
    const arity = expressions.length;
    return function SEL() {
        for (let i = 0; i < arity; ++i) {
            if (expressions[i]()) return true;
        }
        return false;
    };
}
