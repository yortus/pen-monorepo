const epsilon: Rule = {
    kind: 'rule',

    parse() {
        OUT = undefined;
        return true;
    },

    unparse() {
        OUT = '';
        return true;
    },
};
