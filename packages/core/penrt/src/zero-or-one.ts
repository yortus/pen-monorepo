// TODO: doc... this rule is representation-agnostic
function zeroOrOne({expression}: StaticOptions & {expression: Rule}): Rule {
    return function O_1() {
        if (!expression()) OUT = undefined;
        return true;
    };
}
