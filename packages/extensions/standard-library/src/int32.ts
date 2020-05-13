// TODO: handle abstract/concrete...
// tslint:disable: no-bitwise


function int32(_options: StaticOptions): PenVal {
    let result: PenVal = {
        parse: NOT_A_RULE,

        unparse: NOT_A_RULE,

        // TODO: temp testing... the lambda form which takes a `base` arg
        lambda(expr) {
            let base = expr.bindings?.base?.constant?.value as number | undefined ?? 10;
            let signed = expr.bindings?.signed?.constant?.value as boolean | undefined ?? true;
            assert(typeof base === 'number' && base >= 2 && base <= 36);
            assert(typeof signed === 'boolean');

            return {
                parse() {
                    if (!isString(IDOC)) return false;
                    let stateₒ = getState();

                    // Parse optional leading '-' sign (if signed)...
                    let MAX_NUM = signed ? 0x7FFFFFFF : 0xFFFFFFFF;
                    let isNegative = false;
                    if (signed && IMEM < IDOC.length && IDOC.charAt(IMEM) === '-') {
                        isNegative = true;
                        MAX_NUM = 0x80000000;
                        IMEM += 1;
                    }

                    // ...followed by one or more decimal digits. (NB: no exponents).
                    let num = 0;
                    let digits = 0;
                    while (IMEM < IDOC.length) {

                        // Read a digit.
                        let c = IDOC.charCodeAt(IMEM);
                        if (c >= 256) break;
                        let digitValue = DIGIT_VALUES[c];
                        if (digitValue >= base) break;

                        // Update parsed number.
                        num *= base;
                        num += digitValue;

                        // Check for overflow.
                        if (num > MAX_NUM) return setState(stateₒ), false;

                        // Loop again.
                        IMEM += 1;
                        digits += 1;
                    }

                    // Check that we parsed at least one digit.
                    if (digits === 0) return setState(stateₒ), false;

                    // Apply the sign.
                    if (isNegative) num = -num;

                    // Success
                    ODOC = num;
                    return true;
                },

                unparse() {
                    if (typeof IDOC !== 'number' || IMEM !== 0) return false;
                    let num = IDOC;

                    // Determine the number's sign and ensure it is in range.
                    let isNegative = false;
                    let MAX_NUM = 0x7FFFFFFF;
                    if (num < 0) {
                        if (!signed) return false;
                        isNegative = true;
                        num = -num;
                        MAX_NUM = 0x80000000;
                    }
                    if (num > MAX_NUM) return false;

                    // Extract the digits.
                    let digits = [] as number[];
                    while (true) {
                        let d = num % base;
                        num = (num / base) | 0;
                        digits.push(CHAR_CODES[d]);
                        if (num === 0) break;
                    }

                    // Compute the final string.
                    if (isNegative) digits.push(0x2d); // char code for '-'
                    ODOC = String.fromCharCode(...digits.reverse()); // TODO: is this performant?
                    IMEM = 1;
                    return true;
                },
            };
        },
    };

    // TODO: temp testing...
    result.parse = result.lambda!({bindings: {
        base: {constant: {value: 10}},
        unsigned: {constant: {value: false}},
    }} as unknown as PenVal).parse;
    result.unparse = result.lambda!({bindings: {
        base: {constant: {value: 10}},
        unsigned: {constant: {value: false}},
    }} as unknown as PenVal).unparse;

    return result;
}


// TODO: doc...
// use this for bases between 2-36. Get the charCode, ensure < 256, look up DIGIT_VALUES[code], ensure < BASE
// NB: the number 80 is not special, it's just greater than 36 which makes it a sentinel for 'not a digit'.
const DIGIT_VALUES = [
    80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, // 00-0f
    80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, // 10-1f
    80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, // 20-2f
    0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 80, 80, 80, 80, 80, 80, // 30-3f
    80, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, // 40-4f
    25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 80, 80, 80, 80, 80, // 50-5f
    80, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, // 60-6f
    25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 80, 80, 80, 80, 80, // 70-7f
    80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, // 80-8f
    80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, // 90-9f
    80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, // a0-af
    80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, // b0-bf
    80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, // c0-cf
    80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, // d0-df
    80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, // e0-ef
    80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, // f0-ff
];


// TODO: doc...
const CHAR_CODES = [
    0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, // 0-7      01234567
    0x38, 0x39, 0x41, 0x42, 0x43, 0x44, 0x45, 0x46, // 8-15     89ABCDEF
    0x47, 0x48, 0x49, 0x4a, 0x4b, 0x4c, 0x4d, 0x4e, // 16-23    GHIJKLMN
    0x4f, 0x50, 0x51, 0x52, 0x53, 0x54, 0x55, 0x56, // 24-31    OPQRSTUV
    0x57, 0x58, 0x59, 0x5a,                         // 32-35    WXYZ
];
