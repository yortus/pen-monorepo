// TODO: doc... this rule is representation-agnostic
function not(options: StaticOptions & {expression: Rule}): Rule {
    const {expression} = options;
    return function NOT() {
        let stateₒ = getState();
        let result = !expression();
        setState(stateₒ);
        OUT = undefined;
        return result;
    };
}
