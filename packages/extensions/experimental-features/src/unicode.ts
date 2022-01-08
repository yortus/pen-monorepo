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
                    const IPOSₒ = IPOS, OPOSₒ = OPOS;
                    const irep = IREP as Buffer; // IREP is always a Buffer when parsing
                    const ilen = IREP.length;
                    const EOS = '';

                    let len = 0;
                    let num = ''; // TODO: fix this - should actually keep count
                    let c = IPOS < ilen ? String.fromCharCode(irep[IPOS]) : EOS; // TODO: convoluted - simplify whole method
                    while (true) {
                        if (!regex.test(c)) break;
                        num += c;
                        IPOS += 1;
                        len += 1;
                        if (len === maxDigits) break;
                        c = IPOS < ilen ? String.fromCharCode(irep[IPOS]) : EOS;
                    }

                    if (len < minDigits) return IPOS = IPOSₒ, OPOS = OPOSₒ, false;
                    // tslint:disable-next-line: no-eval
                    const buf = Buffer.from(eval(`"\\u{${num}}"`)); // TODO: hacky... fix when we have a charCode
                    for (let i = 0; i < buf.length; ++i) OREP[OPOS++] = buf[i];
                    ATYP |= STRING_CHARS;
                    return true;
                },
                infer: function UNI() {
                    // TODO: generate default value...
                    throw new Error('unicode parse.infer: Not implemented');
                },
            },
            print: {
                full: function UNI() {
                    const ilen = IREP.length; 
                    if (ATYP !== STRING_CHARS || IPOS >= ilen) return false;
                    const IPOSₒ = IPOS, OPOSₒ = OPOS;
                    const irep = IREP as Buffer; // IREP is a Buffer when ATYP === STRING_CHARS
                    const orep = OREP as Buffer; // OREP is always a Buffer when printing
                    let c = irep[IPOS++];
                    if (c < 128) {
                        // no-op
                    }
                    else if (c > 191 && c < 224) {
                        if (IPOS >= ilen) return IPOS = IPOSₒ, OPOS = OPOSₒ, false;
                        c = (c & 31) << 6 | irep[IPOS++] & 63;
                    }
                    else if (c > 223 && c < 240) {
                        if (IPOS + 1 >= ilen) return IPOS = IPOSₒ, OPOS = OPOSₒ, false;
                        c = (c & 15) << 12 | (irep[IPOS++] & 63) << 6 | irep[IPOS++] & 63;
                    }
                    else if (c > 239 && c < 248) {
                        if (IPOS + 2 >= ilen) return IPOS = IPOSₒ, OPOS = OPOSₒ, false;
                        c = (c & 7) << 18 | (irep[IPOS++] & 63) << 12 | (irep[IPOS++] & 63) << 6 | irep[IPOS++] & 63;
                    }
                    else return IPOS = IPOSₒ, OPOS = OPOSₒ, false;

                    const s = c.toString(base).padStart(minDigits, '0');
                    if (s.length > maxDigits) return false;
                    orep.write(s, OPOS);
                    OPOS += s.length;
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
