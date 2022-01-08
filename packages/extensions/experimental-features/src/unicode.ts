// see https://gist.github.com/pascaldekloe/62546103a1576803dade9269ccf76330 for encode/decode algo in js

function unicode(mode: 'parse' | 'print'): Func {
    return function UNI_function(expr) {
        assert(isModule(expr));
        const base = expr('base')?.constant;
        const minDigits = expr('minDigits')?.constant;
        const maxDigits = expr('maxDigits')?.constant;
        assert(typeof base === 'number' && base >= 2 && base <= 36);
        assert(typeof minDigits === 'number' && minDigits >= 1 && minDigits <= 8);
        assert(typeof maxDigits === 'number' && maxDigits >= minDigits && maxDigits <= 8);

        // Construct a regex to match the digits
        const pattern = `[0-${base < 10 ? base - 1 : 9}${base > 10 ? `a-${String.fromCharCode('a'.charCodeAt(0) + base - 11)}` : ''}]`;
        const regex = RegExp(pattern, 'i');

        return createRule(mode, {
            parse: {
                full: function UNI() {
                    const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER;
                    const ibuffer = ICONTENT as Buffer; // ICONTENT is always a Buffer when parsing
                    const ilen = ICONTENT.length;
                    const EOS = '';

                    let len = 0;
                    let num = ''; // TODO: fix this - should actually keep count
                    let c = IPOINTER < ilen ? String.fromCharCode(ibuffer[IPOINTER]) : EOS; // TODO: convoluted - simplify whole method
                    while (true) {
                        if (!regex.test(c)) break;
                        num += c;
                        IPOINTER += 1;
                        len += 1;
                        if (len === maxDigits) break;
                        c = IPOINTER < ilen ? String.fromCharCode(ibuffer[IPOINTER]) : EOS;
                    }

                    if (len < minDigits) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, false;
                    // tslint:disable-next-line: no-eval
                    const buf = Buffer.from(eval(`"\\u{${num}}"`)); // TODO: hacky... fix when we have a charCode
                    for (let i = 0; i < buf.length; ++i) OCONTENT[OPOINTER++] = buf[i];
                    DATATYPE |= STRING_CHARS;
                    return true;
                },
                infer: function UNI() {
                    // TODO: generate default value...
                    throw new Error('unicode parse.infer: Not implemented');
                },
            },
            print: {
                full: function UNI() {
                    const ilen = ICONTENT.length; 
                    if (DATATYPE !== STRING_CHARS || IPOINTER >= ilen) return false;
                    const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER;
                    const ibuffer = ICONTENT as Buffer; // ICONTENT is a Buffer when DATATYPE === STRING_CHARS
                    const obuffer = OCONTENT as Buffer; // OCONTENT is always a Buffer when printing
                    let c = ibuffer[IPOINTER++];
                    if (c < 128) {
                        // no-op
                    }
                    else if (c > 191 && c < 224) {
                        if (IPOINTER >= ilen) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, false;
                        c = (c & 31) << 6 | ibuffer[IPOINTER++] & 63;
                    }
                    else if (c > 223 && c < 240) {
                        if (IPOINTER + 1 >= ilen) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, false;
                        c = (c & 15) << 12 | (ibuffer[IPOINTER++] & 63) << 6 | ibuffer[IPOINTER++] & 63;
                    }
                    else if (c > 239 && c < 248) {
                        if (IPOINTER + 2 >= ilen) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, false;
                        c = (c & 7) << 18 | (ibuffer[IPOINTER++] & 63) << 12 | (ibuffer[IPOINTER++] & 63) << 6 | ibuffer[IPOINTER++] & 63;
                    }
                    else return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, false;

                    const s = c.toString(base).padStart(minDigits, '0');
                    if (s.length > maxDigits) return false;
                    obuffer.write(s, OPOINTER);
                    OPOINTER += s.length;
                    return true;
                },
                infer: function UNI() {
                    // TODO: generate default value...
                    throw new Error('unicode print.infer: Not implemented');
                },
            },
        });
    };
}
