const i32: Rule = {
    kind: 'rule',

    parse() {
        let stateₒ = sys.getState();
        let {IBUF, IPTR} = stateₒ;
        sys.assumeType<string>(IBUF);

        // Parse optional leading '-' sign...
        let isNegative = false;
        if (IPTR < IBUF.length && IBUF.charAt(IPTR) === '-') {
            isNegative = true;
            IPTR += 1;
        }

        // ...followed by one or more decimal digits. (NB: no exponents).
        let num = 0;
        let digits = 0;
        while (IPTR < IBUF.length) {

            // Read a digit
            let c = IBUF.charCodeAt(IPTR);
            if (c < UNICODE_ZERO_DIGIT || c > UNICODE_ZERO_DIGIT + 9) break;

            // Check for overflow
            if (num > ONE_TENTH_MAXINT32) return sys.setState(stateₒ), false;

            // Update parsed number
            num *= 10;
            num += (c - UNICODE_ZERO_DIGIT);
            IPTR += 1;
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
        sys.setState({IBUF, IPTR, OUT: num})
        return true;
    },

    unparse() {
        // TODO: ensure N is a 32-bit integer
        let {IBUF, IPTR} = sys.getState();
        if (typeof IBUF !== 'number' || IPTR !== 0) return false;
        let num = IBUF;
        // tslint:disable-next-line: no-bitwise
        if ((num & 0xFFFFFFFF) !== num) return false;

        // TODO: check sign...
        let isNegative = false;
        if (num < 0) {
            isNegative = true;
            if (num === -2147483648) {
                // Specially handle the one case where N = -N could overflow
                sys.setState({IBUF, IPTR: 1, OUT: '-2147483648'});
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
        sys.setState({IBUF, IPTR: 1, OUT: digits.reverse().join('')});
        return true;
    },
};


// These constants are used by the i32 rule.
const UNICODE_ZERO_DIGIT = '0'.charCodeAt(0);
const ONE_TENTH_MAXINT32 = 0x7FFFFFFF / 10;
