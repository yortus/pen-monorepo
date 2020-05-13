// TODO: doc... has only 'ast' representation
// TODO: support 'txt' representation too?
function numericLiteral(options: StaticOptions & {value: number}): PenVal {
    const {value} = options;
    const NO_CONSUME = options.in === 'nil';
    const NO_PRODUCE = options.out === 'nil';
    return {
        parse() {
            OUT = NO_PRODUCE ? undefined : value;
            return true;
        },

        unparse() {
            if (!NO_CONSUME) {
                if (IN !== value || IP !== 0) return false;
                IP = 1;
            }
            OUT = undefined;
            return true;
        },
    };
}
