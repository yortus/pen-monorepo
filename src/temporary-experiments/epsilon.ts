const epsilon: Rule = {
    kind: 'rule',

    parse() {
        ODOC = undefined;
        return true;
    },

    unparse() {
        ODOC = '';
        return true;
    },
};
