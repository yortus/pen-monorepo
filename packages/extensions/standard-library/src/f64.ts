// TODO: doc... has both 'txt' and 'ast' representation
function f64({mode}: StaticOptions): Rule {
    if (mode === 'parse') {
        return function F64() {
            let num = 0;
            if (HAS_IN) {
                if (typeof IN !== 'string') return false;
                const stateₒ = getState();
                const LEN = IN.length;
                const EOS = 0;
                let digitCount = 0;

                // Parse optional '+' or '-' sign
                let c = IN.charCodeAt(IP);
                if (c === PLUS_SIGN || c === MINUS_SIGN) {
                    IP += 1;
                    c = IP < LEN ? IN.charCodeAt(IP) : EOS;
                }

                // Parse 0..M digits
                while (true) {
                    if (c < ZERO_DIGIT || c > NINE_DIGIT) break;
                    digitCount += 1;
                    IP += 1;
                    c = IP < LEN ? IN.charCodeAt(IP) : EOS;
                }

                // Parse optional '.'
                if (c === DECIMAL_POINT) {
                    IP += 1;
                    c = IP < LEN ? IN.charCodeAt(IP) : EOS;
                }

                // Parse 0..M digits
                while (true) {
                    if (c < ZERO_DIGIT || c > NINE_DIGIT) break;
                    digitCount += 1;
                    IP += 1;
                    c = IP < LEN ? IN.charCodeAt(IP) : EOS;
                }

                // Ensure we have parsed at least one significant digit
                if (digitCount === 0) return setState(stateₒ), false;

                // Parse optional exponent
                if (c === UPPERCASE_E || c === LOWERCASE_E) {
                    IP += 1;
                    c = IP < LEN ? IN.charCodeAt(IP) : EOS;

                    // Parse optional '+' or '-' sign
                    if (c === PLUS_SIGN || c === MINUS_SIGN) {
                        IP += 1;
                        c = IP < LEN ? IN.charCodeAt(IP) : EOS;
                    }

                    // Parse 1..M digits
                    digitCount = 0;
                    while (true) {
                        if (c < ZERO_DIGIT || c > NINE_DIGIT) break;
                        digitCount += 1;
                        IP += 1;
                        c = IP < LEN ? IN.charCodeAt(IP) : EOS;
                    }
                    if (digitCount === 0) return setState(stateₒ), false;
                }

                // There is a syntactically valid float. Delegate parsing to the JS runtime.
                // Reject the number if it parses to Infinity or Nan.
                // TODO: the conversion may still be lossy. Provide a non-lossy mode, like `safenum` does?
                num = Number.parseFloat(IN.slice(stateₒ.IP, IP));
                if (!Number.isFinite(num)) return setState(stateₒ), false;
            }

            // Success
            OUT = HAS_OUT ? num : undefined;
            return true;
        };
    }

    else /* mode === 'print' */ {
        return function F64() {
            let out = '0';
            if (HAS_IN) {
                // Ensure N is a number.
                if (typeof IN !== 'number' || IP !== 0) return false;
                IP = 1;

                // Delegate unparsing to the JS runtime.
                // TODO: the conversion may not exactly match the original string. Add this to the lossiness list.
                out = String(IN);
            }

            // Success
            OUT = HAS_OUT ? out : undefined;
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
