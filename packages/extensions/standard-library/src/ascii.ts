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
                let cc: number;
                if (HAS_IN) {
                    if (CPOS >= (CREP as string).length) return false;
                    cc = (CREP as string).charCodeAt(CPOS);
                    if (cc < min || cc > max) return false;
                    CPOS += 1;
                }
                else {
                    cc = min as number;
                }
                if (HAS_OUT) AREP[APOS++] = String.fromCharCode(cc);
                ATYP = HAS_OUT ? STRING : NOTHING;
                return true;
            };
        }

        else /* mode === 'print' */ {
            return function ASC() {
                let cc: number;
                if (HAS_IN) {
                    if (ATYP !== STRING) return false;
                    const arep = AREP as unknown as string; // TODO: fix cast
                    if (APOS >= arep.length) return false;
                    cc = arep.charCodeAt(APOS);
                    if (cc < min || cc > max) return false;
                    APOS += 1;
                }
                else {
                    cc = min as number;
                }
                if (HAS_OUT) (CREP as any)[CPOS++] = String.fromCharCode(cc);
                return true;
            };
        }
    };
}
