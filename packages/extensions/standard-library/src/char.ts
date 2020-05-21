// TODO: doc... has both 'txt' and 'ast' representation
// TODO: supports only single UTF-16 code units, ie basic multilingual plane. Extend to full unicode support somehow...
// TODO: optimise 'any char' case better
// TODO: optimise all cases better
function char(options: StaticOptions): PenVal {
    const checkInType = options.in !== 'txt';
    let result: PenVal = {
        lambda(expr) {
            let min = expr.bindings?.min?.constant?.value as string | undefined ?? '\u0000';
            let max = expr.bindings?.max?.constant?.value as string | undefined ?? '\uFFFF';
            assert(typeof min === 'string' && min.length === 1);
            assert(typeof max === 'string' && max.length === 1);

            if (options.in === 'nil') {
                const out = options.out === 'nil' ? undefined : min;
                return {rule: function CHA() { return OUT = out, true; }};
            }

            return {
                rule: function CHA() {
                    if (checkInType && typeof IN !== 'string') return false;
                    if (IP < 0 || IP >= (IN as string).length) return false;
                    let c = (IN as string).charAt(IP);
                    if (c < min || c > max) return false;
                    IP += 1;
                    OUT = options.out === 'nil' ? undefined : c;
                    return true;
                },
            };
        },
    };

    // TODO: temp testing...
    result.rule = result.lambda!({bindings: {
        min: {constant: {value: '\u0000'}},
        max: {constant: {value: '\uFFFF'}},
    }} as unknown as PenVal).rule;

    return result;
}
