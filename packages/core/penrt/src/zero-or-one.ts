// TODO: doc... this rule is representation-agnostic
function zeroOrOne(options: StaticOptions & {expression: Rule}): Rule {
    const {expression} = options;
    return function O_1() {
        if (!expression()) OUT = undefined;
        return true;
    };
}
