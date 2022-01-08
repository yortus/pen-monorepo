// TODO: doc... has both 'txt' and 'ast' representation
// TODO: revise/document range and precision of floats that can be parsed/printed by this rule
function floatString(mode: 'parse' | 'print'): Rule {
    return createRule(mode, {
        parse: {
            full: function FSTR() {
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER;
                const ibuffer = ICONTENT as Buffer; // ICONTENT is always a Buffer when parsing
                const EOS = 0;
                let digitCount = 0;

                // Parse optional '+' or '-' sign
                let cc = ibuffer[IPOINTER];
                if (cc === PLUS_SIGN || cc === MINUS_SIGN) {
                    IPOINTER += 1;
                    cc = IPOINTER < ICONTENT.length ? ibuffer[IPOINTER] : EOS;
                }

                // Parse 0..M digits
                while (true) {
                    if (cc < ZERO_DIGIT || cc > NINE_DIGIT) break;
                    digitCount += 1;
                    IPOINTER += 1;
                    cc = IPOINTER < ICONTENT.length ? ibuffer[IPOINTER] : EOS;
                }

                // Parse optional '.'
                if (cc === DECIMAL_POINT) {
                    IPOINTER += 1;
                    cc = IPOINTER < ICONTENT.length ? ibuffer[IPOINTER] : EOS;
                }

                // Parse 0..M digits
                while (true) {
                    if (cc < ZERO_DIGIT || cc > NINE_DIGIT) break;
                    digitCount += 1;
                    IPOINTER += 1;
                    cc = IPOINTER < ICONTENT.length ? ibuffer[IPOINTER] : EOS;
                }

                // Ensure we have parsed at least one significant digit
                if (digitCount === 0) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, false;

                // Parse optional exponent
                if (cc === UPPERCASE_E || cc === LOWERCASE_E) {
                    IPOINTER += 1;
                    cc = IPOINTER < ICONTENT.length ? ibuffer[IPOINTER] : EOS;

                    // Parse optional '+' or '-' sign
                    if (cc === PLUS_SIGN || cc === MINUS_SIGN) {
                        IPOINTER += 1;
                        cc = IPOINTER < ICONTENT.length ? ibuffer[IPOINTER] : EOS;
                    }

                    // Parse 1..M digits
                    digitCount = 0;
                    while (true) {
                        if (cc < ZERO_DIGIT || cc > NINE_DIGIT) break;
                        digitCount += 1;
                        IPOINTER += 1;
                        cc = IPOINTER < ICONTENT.length ? ibuffer[IPOINTER] : EOS;
                    }
                    if (digitCount === 0) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, false;
                }

                // There is a syntactically valid float. Delegate parsing to the JS runtime.
                // Reject the number if it parses to Infinity or Nan.
                // TODO: the conversion may still be lossy. Provide a non-lossy mode, like `safenum` does?
                const num = Number.parseFloat(ibuffer.toString('utf8', IPOINTERₒ, IPOINTER));
                if (!Number.isFinite(num)) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, false;

                // Success
                OCONTENT[OPOINTER++] = num;
                DATATYPE |= SCALAR;
                return true;
            },
            infer: function ISTR() {
                OCONTENT[OPOINTER++] = 0;
                DATATYPE |= SCALAR;
                return true;
            },
        },
        print: {
            full: function FSTR() {
                if (DATATYPE !== SCALAR) return false;
                const obuffer = OCONTENT as Buffer; // OCONTENT is always a Buffer when printing
                const num = ICONTENT[IPOINTER];
                if (typeof num !== 'number') return false;
                IPOINTER += 1;

                // Delegate unparsing to the JS runtime.
                // TODO: the conversion may not exactly match the original string. Add this to the lossiness list.
                const out = String(num);

                // Success
                OPOINTER += obuffer.write(out, OPOINTER, undefined, 'utf8');
                return true;
            },
            infer: function FSTR() {
                OCONTENT[OPOINTER++] = ZERO_DIGIT;
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
