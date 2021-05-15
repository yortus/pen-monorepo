// TODO: doc... has both 'txt' and 'ast' representation
function f64({mode}: StaticOptions): Rule {
    if (mode === 'parse') {
        return function F64() {
            let num = 0;
            if (HAS_IN) {
                const [APOSₒ, CPOSₒ] = savepoint();
                const LEN = CREP.length;
                const EOS = 0;
                let digitCount = 0;

                // Parse optional '+' or '-' sign
                let c = CREP.charCodeAt(CPOS);
                if (c === PLUS_SIGN || c === MINUS_SIGN) {
                    CPOS += 1;
                    c = CPOS < LEN ? CREP.charCodeAt(CPOS) : EOS;
                }

                // Parse 0..M digits
                while (true) {
                    if (c < ZERO_DIGIT || c > NINE_DIGIT) break;
                    digitCount += 1;
                    CPOS += 1;
                    c = CPOS < LEN ? CREP.charCodeAt(CPOS) : EOS;
                }

                // Parse optional '.'
                if (c === DECIMAL_POINT) {
                    CPOS += 1;
                    c = CPOS < LEN ? CREP.charCodeAt(CPOS) : EOS;
                }

                // Parse 0..M digits
                while (true) {
                    if (c < ZERO_DIGIT || c > NINE_DIGIT) break;
                    digitCount += 1;
                    CPOS += 1;
                    c = CPOS < LEN ? CREP.charCodeAt(CPOS) : EOS;
                }

                // Ensure we have parsed at least one significant digit
                if (digitCount === 0) return backtrack(APOSₒ, CPOSₒ);

                // Parse optional exponent
                if (c === UPPERCASE_E || c === LOWERCASE_E) {
                    CPOS += 1;
                    c = CPOS < LEN ? CREP.charCodeAt(CPOS) : EOS;

                    // Parse optional '+' or '-' sign
                    if (c === PLUS_SIGN || c === MINUS_SIGN) {
                        CPOS += 1;
                        c = CPOS < LEN ? CREP.charCodeAt(CPOS) : EOS;
                    }

                    // Parse 1..M digits
                    digitCount = 0;
                    while (true) {
                        if (c < ZERO_DIGIT || c > NINE_DIGIT) break;
                        digitCount += 1;
                        CPOS += 1;
                        c = CPOS < LEN ? CREP.charCodeAt(CPOS) : EOS;
                    }
                    if (digitCount === 0) return backtrack(APOSₒ, CPOSₒ);
                }

                // There is a syntactically valid float. Delegate parsing to the JS runtime.
                // Reject the number if it parses to Infinity or Nan.
                // TODO: the conversion may still be lossy. Provide a non-lossy mode, like `safenum` does?
                num = Number.parseFloat(CREP.slice(CPOSₒ, CPOS));
                if (!Number.isFinite(num)) return backtrack(APOSₒ, CPOSₒ);
            }

            // Success
            if (HAS_OUT) AREP[APOS++] = num;
            ATYP = HAS_OUT ? SCALAR : NOTHING;
            return true;
        };
    }

    else /* mode === 'print' */ {
        return function F64() {
            let out = '0';
            if (HAS_IN) {
                // Ensure N is a number.
                if (ATYP !== SCALAR) return false;
                let num = AREP[APOS] as number;
                if (typeof num !== 'number') return false;
                APOS += 1;

                // Delegate unparsing to the JS runtime.
                // TODO: the conversion may not exactly match the original string. Add this to the lossiness list.
                out = String(num);
            }

            // Success
            if (HAS_OUT) (CREP as any)[CPOS++] = out;
            return true;
        };
    }
}


// These constants are used by the f64 rule.
const PLUS_SIGN = '+'.charCodeAt(0);
const MINUS_SIGN = '-'.charCodeAt(0);
const DECIMAL_POINT = '.'.charCodeAt(0);
const ZERO_DIGIT = '0'.charCodeAt(0);
const NINE_DIGIT = '9'.charCodeAt(0);
const LOWERCASE_E = 'e'.charCodeAt(0);
const UPPERCASE_E = 'E'.charCodeAt(0);
