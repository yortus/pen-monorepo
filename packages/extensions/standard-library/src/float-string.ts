// TODO: doc... has both 'txt' and 'ast' representation
// TODO: revise/document range and precision of floats that can be parsed/printed by this rule
function floatString(mode: 'parse' | 'print'): Rule {
    return createRule(mode, {
        parse: {
            full: function FSTR() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS;
                const irep = IREP as Buffer; // IREP is always a Buffer when parsing
                const ilen = IREP.length;
                const EOS = 0;
                let digitCount = 0;

                // Parse optional '+' or '-' sign
                let cc = irep[IPOS];
                if (cc === PLUS_SIGN || cc === MINUS_SIGN) {
                    IPOS += 1;
                    cc = IPOS < ilen ? irep[IPOS] : EOS;
                }

                // Parse 0..M digits
                while (true) {
                    if (cc < ZERO_DIGIT || cc > NINE_DIGIT) break;
                    digitCount += 1;
                    IPOS += 1;
                    cc = IPOS < ilen ? irep[IPOS] : EOS;
                }

                // Parse optional '.'
                if (cc === DECIMAL_POINT) {
                    IPOS += 1;
                    cc = IPOS < ilen ? irep[IPOS] : EOS;
                }

                // Parse 0..M digits
                while (true) {
                    if (cc < ZERO_DIGIT || cc > NINE_DIGIT) break;
                    digitCount += 1;
                    IPOS += 1;
                    cc = IPOS < ilen ? irep[IPOS] : EOS;
                }

                // Ensure we have parsed at least one significant digit
                if (digitCount === 0) return IPOS = IPOSₒ, OPOS = OPOSₒ, false;

                // Parse optional exponent
                if (cc === UPPERCASE_E || cc === LOWERCASE_E) {
                    IPOS += 1;
                    cc = IPOS < ilen ? irep[IPOS] : EOS;

                    // Parse optional '+' or '-' sign
                    if (cc === PLUS_SIGN || cc === MINUS_SIGN) {
                        IPOS += 1;
                        cc = IPOS < ilen ? irep[IPOS] : EOS;
                    }

                    // Parse 1..M digits
                    digitCount = 0;
                    while (true) {
                        if (cc < ZERO_DIGIT || cc > NINE_DIGIT) break;
                        digitCount += 1;
                        IPOS += 1;
                        cc = IPOS < ilen ? irep[IPOS] : EOS;
                    }
                    if (digitCount === 0) return IPOS = IPOSₒ, OPOS = OPOSₒ, false;
                }

                // There is a syntactically valid float. Delegate parsing to the JS runtime.
                // Reject the number if it parses to Infinity or Nan.
                // TODO: the conversion may still be lossy. Provide a non-lossy mode, like `safenum` does?
                const num = Number.parseFloat(irep.toString('utf8', IPOSₒ, IPOS));
                if (!Number.isFinite(num)) return IPOS = IPOSₒ, OPOS = OPOSₒ, false;

                // Success
                OREP[OPOS++] = num;
                ATYP |= SCALAR;
                return true;
            },
            infer: function ISTR() {
                OREP[OPOS++] = 0;
                ATYP |= SCALAR;
                return true;
            },
        },
        print: {
            full: function FSTR() {
                if (ATYP !== SCALAR) return false;
                const orep = OREP as Buffer; // OREP is always a Buffer when printing
                const num = IREP[IPOS];
                if (typeof num !== 'number') return false;
                IPOS += 1;

                // Delegate unparsing to the JS runtime.
                // TODO: the conversion may not exactly match the original string. Add this to the lossiness list.
                const out = String(num);

                // Success
                OPOS += orep.write(out, OPOS, undefined, 'utf8');
                return true;
            },
            infer: function FSTR() {
                OREP[OPOS++] = ZERO_DIGIT;
                return true;
            },
        },
    });
}


// These constants are used by the floatString rule.
const PLUS_SIGN = '+'.charCodeAt(0);
const MINUS_SIGN = '-'.charCodeAt(0);
const DECIMAL_POINT = '.'.charCodeAt(0);
const ZERO_DIGIT = '0'.charCodeAt(0);
const NINE_DIGIT = '9'.charCodeAt(0);
const LOWERCASE_E = 'e'.charCodeAt(0);
const UPPERCASE_E = 'E'.charCodeAt(0);
