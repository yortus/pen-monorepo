const epsilon: Rule = {
    kind: 'rule',

    parse() {
        sys.setOutState(undefined);
        return true;
    },

    unparse() {
        sys.setOutState(undefined);
        return true;
    },
};
