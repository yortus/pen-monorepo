// TODO: doc... has both 'txt' and 'ast' representation
// TODO: revise/document range and precision of floats that can be parsed/printed by this rule
function floatString({mode}: StaticOptions): Rule {
    return createRule(mode, {
        parse: function FSTR() {
            let num = 0;
            const [APOSₒ, CPOSₒ] = [APOS, CPOS];
            const LEN = CREP.length;
            const EOS = 0;
            let digitCount = 0;

            // Parse optional '+' or '-' sign
            let cc = CREP[CPOS];
            if (cc === PLUS_SIGN || cc === MINUS_SIGN) {
                CPOS += 1;
                cc = CPOS < LEN ? CREP[CPOS] : EOS;
            }

            // Parse 0..M digits
            while (true) {
                if (cc < ZERO_DIGIT || cc > NINE_DIGIT) break;
                digitCount += 1;
                CPOS += 1;
                cc = CPOS < LEN ? CREP[CPOS] : EOS;
            }

            // Parse optional '.'
            if (cc === DECIMAL_POINT) {
                CPOS += 1;
                cc = CPOS < LEN ? CREP[CPOS] : EOS;
            }

            // Parse 0..M digits
            while (true) {
                if (cc < ZERO_DIGIT || cc > NINE_DIGIT) break;
                digitCount += 1;
                CPOS += 1;
                cc = CPOS < LEN ? CREP[CPOS] : EOS;
            }

            // Ensure we have parsed at least one significant digit
            if (digitCount === 0) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;

            // Parse optional exponent
            if (cc === UPPERCASE_E || cc === LOWERCASE_E) {
                CPOS += 1;
                cc = CPOS < LEN ? CREP[CPOS] : EOS;

                // Parse optional '+' or '-' sign
                if (cc === PLUS_SIGN || cc === MINUS_SIGN) {
                    CPOS += 1;
                    cc = CPOS < LEN ? CREP[CPOS] : EOS;
                }

                // Parse 1..M digits
                digitCount = 0;
                while (true) {
                    if (cc < ZERO_DIGIT || cc > NINE_DIGIT) break;
                    digitCount += 1;
                    CPOS += 1;
                    cc = CPOS < LEN ? CREP[CPOS] : EOS;
                }
                if (digitCount === 0) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
            }

            // There is a syntactically valid float. Delegate parsing to the JS runtime.
            // Reject the number if it parses to Infinity or Nan.
            // TODO: the conversion may still be lossy. Provide a non-lossy mode, like `safenum` does?
            num = Number.parseFloat(CREP.toString('utf8', CPOSₒ, CPOS));
            if (!Number.isFinite(num)) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;

            // Success
            emitScalar(num);
            return true;
        },

        parseDefault: function ISTR() {
            emitScalar(0);
            return true;
        },

        print: function FSTR() {
            let out = '0';
            // Ensure N is a number.
            if (AR !== SCALAR) return false;
            let num = AREP[APOS] as number;
            if (typeof num !== 'number') return false;
            APOS += 1;

            // Delegate unparsing to the JS runtime.
            // TODO: the conversion may not exactly match the original string. Add this to the lossiness list.
            out = String(num);

            // Success
            CPOS += CREP.write(out, CPOS, undefined, 'utf8');
            return true;
        },

        printDefault: function FSTR() {
            CREP[CPOS++] = ZERO_DIGIT;
            return true;
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
