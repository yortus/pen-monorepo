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

        if (!hasInput(mode)) {
            assert(hasOutput(mode));
            return function CHA() { return OUT = min, true; };
        }

        return function CHA() {
            if (isPrint(mode) && typeof IN !== 'string') return false;
            if (IP < 0 || IP >= (IN as string).length) return false;
            const c = (IN as string).charAt(IP);
            if (checkRange && (c < min || c > max)) return false;
            IP += 1;
            OUT = hasOutput(mode) ? c : undefined;
            return true;
        };
    };
}
