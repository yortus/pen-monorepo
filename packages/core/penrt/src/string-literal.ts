// TODO: doc... has both 'txt' and 'ast' representation
function stringLiteral(options: StaticOptions & {value: string}): PenVal {
    const {value} = options;
    const NO_CONSUME = options.in === 'nil';
    const NO_PRODUCE = options.out === 'nil';
    return {
        parse() {
            if (!NO_CONSUME) {
                if (!isString(IN)) return false;
                if (!matchesAt(IN, value, IP)) return false;
                IP += value.length;
            }
            OUT = NO_PRODUCE ? undefined : value;
            return true;
        },

        unparse() {
            if (!NO_CONSUME) {
                if (!isString(IN)) return false;
                if (!matchesAt(IN, value, IP)) return false;
                IP += value.length;
            }
            OUT = NO_PRODUCE ? undefined : value;
            return true;
        },
    };
}
