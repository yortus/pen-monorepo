// see https://gist.github.com/pascaldekloe/62546103a1576803dade9269ccf76330 for encode/decode algo in js

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

                // TODO: respect NIL AREP/CREP...

                const [APOSₒ, CPOSₒ] = savepoint();
                const LEN = CREP.length;
                const EOS = '';

                let len = 0;
                let num = ''; // TODO: fix this - should actually keep count
                let c = CPOS < LEN ? String.fromCharCode(CREP[CPOS]) : EOS; // TODO: convoluted - simplify whole method
                while (true) {
                    if (!regex.test(c)) break;
                    num += c;
                    CPOS += 1;
                    len += 1;
                    if (len === maxDigits) break;
                    c = CPOS < LEN ? String.fromCharCode(CREP[CPOS]) : EOS;
                }

                if (len < minDigits) return backtrack(APOSₒ, CPOSₒ);
                // tslint:disable-next-line: no-eval
                emitBytes(...Buffer.from(eval(`"\\u{${num}}"`)).values()); // TODO: hacky... fix when we have a charCode
                return true;
            };
        }

        else /* mode === 'print' */ {
            return function UNI() {

                // TODO: respect NIL AREP/CREP...

                if (ATYP !== STRING) return false;
                const [APOSₒ, CPOSₒ] = savepoint();
                const bytes = AREP as Buffer;
                let c = bytes[APOS++];
                if (c < 128) {
                    // no-op
                }
                else if (c > 191 && c < 224) {
                    if (APOS >= bytes.length) return backtrack(APOSₒ, CPOSₒ);
                    c = (c & 31) << 6 | bytes[APOS++] & 63;
                }
                else if (c > 223 && c < 240) {
                    if (APOS + 1 >= bytes.length) return backtrack(APOSₒ, CPOSₒ);
                    c = (c & 15) << 12 | (bytes[APOS++] & 63) << 6 | bytes[APOS++] & 63;
                }
                else if (c > 239 && c < 248) {
                    if (APOS + 2 >= bytes.length) return backtrack(APOSₒ, CPOSₒ);
                    c = (c & 7) << 18 | (bytes[APOS++] & 63) << 12 | (bytes[APOS++] & 63) << 6 | bytes[APOS++] & 63;
                }
                else return backtrack(APOSₒ, CPOSₒ);

                const s = c.toString(base).padStart(minDigits, '0');
                if (s.length > maxDigits) return false;
                CREP.write(s, CPOS);
                CPOS += s.length;
                return true;
            };
        }
    };
}
