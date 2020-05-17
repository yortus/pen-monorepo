// TODO: doc... this rule is representation-agnostic
function zeroOrOne(options: StaticOptions & {expression: PenVal}): PenVal {
    const {expression} = options;
    return {
        rule: function O_1() {
            if (!expression.rule!()) OUT = undefined;
            return true;
        },
    };
}
