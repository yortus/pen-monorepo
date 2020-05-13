// TODO: handle abstract/concrete...


function float64(_options: StaticOptions): PenVal {
    return {
        bindings: {},

        parse() {
            if (!isString(IDOC)) return false;
            let stateₒ = getState();
            const LEN = IDOC.length;
            const EOS = 0;
            let digitCount = 0;

            // Parse optional '+' or '-' sign
            let c = IDOC.charCodeAt(IMEM);
            if (c === PLUS_SIGN || c === MINUS_SIGN) {
                IMEM += 1;
                c = IMEM < LEN ? IDOC.charCodeAt(IMEM) : EOS;
            }

            // Parse 0..M digits
            while (true) {
                if (c < ZERO_DIGIT || c > NINE_DIGIT) break;
                digitCount += 1;
                IMEM += 1;
                c = IMEM < LEN ? IDOC.charCodeAt(IMEM) : EOS;
            }

            // Parse optional '.'
            if (c === DECIMAL_POINT) {
                IMEM += 1;
                c = IMEM < LEN ? IDOC.charCodeAt(IMEM) : EOS;
            }

            // Parse 0..M digits
            while (true) {
                if (c < ZERO_DIGIT || c > NINE_DIGIT) break;
                digitCount += 1;
                IMEM += 1;
                c = IMEM < LEN ? IDOC.charCodeAt(IMEM) : EOS;
            }

            // Ensure we have parsed at least one significant digit
            if (digitCount === 0) return setState(stateₒ), false;

            // Parse optional exponent
            if (c === UPPERCASE_E || c === LOWERCASE_E) {
                IMEM += 1;
                c = IMEM < LEN ? IDOC.charCodeAt(IMEM) : EOS;

                // Parse optional '+' or '-' sign
                if (c === PLUS_SIGN || c === MINUS_SIGN) {
                    IMEM += 1;
                    c = IMEM < LEN ? IDOC.charCodeAt(IMEM) : EOS;
                }

                // Parse 1..M digits
                digitCount = 0;
                while (true) {
                    if (c < ZERO_DIGIT || c > NINE_DIGIT) break;
                    digitCount += 1;
                    IMEM += 1;
                    c = IMEM < LEN ? IDOC.charCodeAt(IMEM) : EOS;
                }
                if (digitCount === 0) return setState(stateₒ), false;
            }

            // There is a syntactically valid float. Delegate parsing to the JS runtime.
            // Reject the number if it parses to Infinity or Nan.
            // TODO: the conversion may still be lossy. Provide a non-lossy mode, like `safenum` does?
            let num = Number.parseFloat(IDOC.slice(stateₒ.IMEM, IMEM));
            if (!Number.isFinite(num)) return setState(stateₒ), false;

            // Success
            ODOC = num;
            return true;
        },

        unparse() {
            // Ensure N is a number.
            if (typeof IDOC !== 'number' || IMEM !== 0) return false;

            // Delegate unparsing to the JS runtime.
            // TODO: the conversion may not exactly match the original string. Add this to the lossiness list.
            ODOC = String(IDOC);
            IMEM = 1;
            return true;
        },

        apply: NOT_A_LAMBDA,
    };
}


// These constants are used by the float64 rule.
const PLUS_SIGN = '+'.charCodeAt(0);
const MINUS_SIGN = '-'.charCodeAt(0);
const DECIMAL_POINT = '.'.charCodeAt(0);
const ZERO_DIGIT = '0'.charCodeAt(0);
const NINE_DIGIT = '9'.charCodeAt(0);
const LOWERCASE_E = 'e'.charCodeAt(0);
const UPPERCASE_E = 'E'.charCodeAt(0);
