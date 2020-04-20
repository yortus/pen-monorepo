// TODO: handle abstract/concrete...


const int32: Rule = {
    kind: 'rule',

    parse() {
        let stateₒ = sys.getState();
        let {IDOC, IMEM, INUL, ONUL} = stateₒ;
        if (!sys.isString(IDOC)) return false;

        // Parse optional leading '-' sign...
        let isNegative = false;
        if (IMEM < IDOC.length && IDOC.charAt(IMEM) === '-') {
            isNegative = true;
            IMEM += 1;
        }

        // ...followed by one or more decimal digits. (NB: no exponents).
        let num = 0;
        let digits = 0;
        while (IMEM < IDOC.length) {

            // Read a digit
            let c = IDOC.charCodeAt(IMEM);
            if (c < UNICODE_ZERO_DIGIT || c > UNICODE_ZERO_DIGIT + 9) break;

            // Check for overflow
            if (num > ONE_TENTH_MAXINT32) return sys.setState(stateₒ), false;

            // Update parsed number
            num *= 10;
            num += (c - UNICODE_ZERO_DIGIT);
            IMEM += 1;
            digits += 1;
        }

        // Check that we parsed at least one digit.
        if (digits === 0) return sys.setState(stateₒ), false;

        // Apply the sign.
        if (isNegative) num = -num;

        // Check for over/under-flow. This *is* needed to catch -2147483649, 2147483648 and 2147483649.
        // tslint:disable-next-line: no-bitwise
        if (isNegative ? (num & 0xFFFFFFFF) >= 0 : (num & 0xFFFFFFFF) < 0) return sys.setState(stateₒ), false;

        // Success
        sys.setState({IDOC, IMEM, ODOC: num, INUL, ONUL});
        return true;
    },

    unparse() {
        // TODO: ensure N is a 32-bit integer
        let {IDOC, IMEM, INUL, ONUL} = sys.getState();
        if (typeof IDOC !== 'number' || IMEM !== 0) return false;
        let num = IDOC;
        // tslint:disable-next-line: no-bitwise
        if ((num & 0xFFFFFFFF) !== num) return false;

        // TODO: check sign...
        let isNegative = false;
        if (num < 0) {
            isNegative = true;
            if (num === -2147483648) {
                // Specially handle the one case where N = -N could overflow
                sys.setState({IDOC, IMEM: 1, ODOC: '-2147483648', INUL, ONUL});
                return true;
            }
            num = -num as number;
        }

        // TODO: ...then digits
        let digits = [] as string[];
        while (true) {
            let d = num % 10;
            // tslint:disable-next-line: no-bitwise
            num = (num / 10) | 0;
            digits.push(String.fromCharCode(UNICODE_ZERO_DIGIT + d));
            if (num === 0) break;
        }

        // TODO: compute final string...
        if (isNegative) digits.push('-');
        sys.setState({IDOC, IMEM: 1, ODOC: digits.reverse().join(''), INUL, ONUL});
        return true;
    },
};


// These constants are used by the int32 rule.
const UNICODE_ZERO_DIGIT = '0'.charCodeAt(0);
const ONE_TENTH_MAXINT32 = 0x7FFFFFFF / 10;
