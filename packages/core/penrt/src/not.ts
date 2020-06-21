// TODO: doc... this rule is representation-agnostic
function not({expression}: StaticOptions & {expression: Rule}): Rule {
    return function NOT() {
        let stateₒ = getState();
        let result = !expression();
        setState(stateₒ);
        OUT = undefined;
        return result;
    };
}
