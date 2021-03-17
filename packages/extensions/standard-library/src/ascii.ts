// TODO: doc... has both 'txt' and 'ast' representation
// TODO: supports only single UTF-16 code units, ie basic multilingual plane. Extend to full unicode support somehow...
// TODO: optimise 'any char' case better - or is that a whole other primitive now?
// TODO: optimise all cases better
function ascii({mode}: StaticOptions): Generic {
    return function ASC_generic(expr) {
        assert(isModule(expr));
        let min = expr('min')?.constant?.value as string | number | undefined ?? 0x00;
        let max = expr('max')?.constant?.value as string | number | undefined ?? 0x7f;
        if (typeof min === 'string' && min.length === 1) min = min.charCodeAt(0);
        if (typeof max === 'string' && max.length === 1) max = max.charCodeAt(0);
        assert(typeof min === 'number' && min >= 0x00 && min <= 0x7f);
        assert(typeof max === 'number' && max >= 0x00 && max <= 0x7f);

        if (mode === 'parse') {
            return function ASC() {
                let c: string | undefined;
                if (HAS_IN) {
                    if (IP < 0 || IP >= (IN as string).length) return false;
                    c = (IN as string).charAt(IP);
                    const cc = c.charCodeAt(0); // TODO: inefficient! improve...
                    if (cc < min || cc > max) return false;
                    IP += 1;
                }
                else {
                    c = String.fromCharCode(min as number); // TODO: inefficient! improve...
                }
                OUT = HAS_OUT ? c : undefined;
                return true;
            };
        }

        else /* mode === 'print' */ {
            return function ASC() {
                let c: string | undefined;
                if (HAS_IN) {
                    if (typeof IN !== 'string') return false;
                    if (IP < 0 || IP >= (IN as string).length) return false;
                    c = (IN as string).charAt(IP);
                    const cc = c.charCodeAt(0); // TODO: inefficient! improve...
                    if (cc < min || cc > max) return false;
                    IP += 1;
                }
                else {
                    c = String.fromCharCode(min as number); // TODO: inefficient! improve...
                }
                OUT = HAS_OUT ? c : undefined;
                return true;
            };
        }
    };
}
