// TODO: doc... has only 'ast' representation
// TODO: support 'txt' representation too?
function numericLiteral(options: StaticOptions & {value: number}): PenVal {
    const {value} = options;
    const NO_CONSUME = options.in === 'nil';
    const NO_PRODUCE = options.out === 'nil';

    if (options.in === 'txt' || options.out === 'ast') {
        return {
            rule() {
                OUT = NO_PRODUCE ? undefined : value;
                return true;
            },
        };
    }

    if (options.in === 'ast' || options.out === 'txt') {
        return {
            rule() {
                if (!NO_CONSUME) {
                    if (IN !== value || IP !== 0) return false;
                    IP = 1;
                }
                OUT = undefined;
                return true;
            },
        };
    }

    throw new Error(`Unsupported operation '${options.in}'->'${options.out}'`);
}
