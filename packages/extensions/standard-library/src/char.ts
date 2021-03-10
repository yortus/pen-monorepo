// TODO: doc... has both 'txt' and 'ast' representation
// TODO: supports only single UTF-16 code units, ie basic multilingual plane. Extend to full unicode support somehow...
// TODO: optimise 'any char' case better
// TODO: optimise all cases better
function char({mode}: StaticOptions): Generic {
    return function CHA_generic(expr) {
        assert(isModule(expr));
        const min = expr('min')?.constant?.value as string | undefined ?? '\u0000';
        const max = expr('max')?.constant?.value as string | undefined ?? '\uFFFF';
        assert(typeof min === 'string' && min.length === 1);
        assert(typeof max === 'string' && max.length === 1);
        const checkRange = min !== '\u0000' || max !== '\uFFFF';

        return function CHA() {
            let c = min;
            if (HAS_IN) {
                if (mode === 'print' && typeof IN !== 'string') return false;
                if (IP < 0 || IP >= (IN as string).length) return false;
                c = (IN as string).charAt(IP);
                if (checkRange && (c < min || c > max)) return false;
                IP += 1;
            }
            OUT = HAS_OUT ? c : undefined;
            return true;
        };
    };
}
