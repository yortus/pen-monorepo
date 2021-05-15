function unicode({mode}: StaticOptions): Generic {
    return function UNI_generic(expr) {
        assert(isModule(expr));
        const base = expr('base')?.constant?.value as number;
        const minDigits = expr('minDigits')?.constant?.value as number;
        const maxDigits = expr('maxDigits')?.constant?.value as number;
        assert(typeof base === 'number' && base >= 2 && base <= 36);
        assert(typeof minDigits === 'number' && minDigits >= 1 && minDigits <= 8);
        assert(typeof maxDigits === 'number' && maxDigits >= minDigits && maxDigits <= 8);

        // Construct a regex to match the digits
        const pattern = `[0-${base < 10 ? base - 1 : 9}${base > 10 ? `a-${String.fromCharCode('a'.charCodeAt(0) + base - 11)}` : ''}]`;
        const regex = RegExp(pattern, 'i');

        if (mode === 'parse') {
            return function UNI() {
                // TODO: was... still need equiv?   if (typeof IN !== 'string') return false;
                const [APOSₒ, CPOSₒ] = savepoint();
                const LEN = CREP.length;
                const EOS = '';

                let len = 0;
                let num = ''; // TODO: fix this - should actually keep count
                let c = CPOS < LEN ? CREP.charAt(CPOS) : EOS;
                while (true) {
                    if (!regex.test(c)) break;
                    num += c;
                    CPOS += 1;
                    len += 1;
                    if (len === maxDigits) break;
                    c = CPOS < LEN ? CREP.charAt(CPOS) : EOS;
                }

                if (len < minDigits) return backtrack(APOSₒ, CPOSₒ);
                // tslint:disable-next-line: no-eval
                if (HAS_OUT) AREP[APOS++] = eval(`"\\u{${num}}"`); // TODO: hacky... fix when we have a charCode
                ATYP = HAS_OUT ? STRING : NOTHING;
                return true;
            };
        }

        else /* mode === 'print' */ {
            return function UNI() {
                // TODO: implement
                return false;
            };
        }
    };
}
