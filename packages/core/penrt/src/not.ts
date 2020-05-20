// TODO: doc... this rule is representation-agnostic
function not(options: StaticOptions & {expression: PenVal}): PenVal {
    const {expression} = options;
    return {
        rule: function NOT() {
            let stateₒ = getState();
            let result = !expression.rule!();
            setState(stateₒ);
            OUT = undefined;
            return result;
        },
    };
}
