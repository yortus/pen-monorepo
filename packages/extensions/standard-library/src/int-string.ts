// TODO: doc... has both 'txt' and 'ast' representation
// TODO: revise/document range of ints that can be parsed/printed by this rule
function intString(mode: 'parse' | 'print'): Func {
    return function ISTR_function(expr) {
        assert(isModule(expr));
        const base = expr('base')?.constant ?? 10;
        const signed = expr('signed')?.constant ?? true;
        assert(typeof base === 'number' && base >= 2 && base <= 36);
        assert(typeof signed === 'boolean');

        return createRule(mode, {
            parse: {
                full: function ISTR() {
                    let num = 0;
                    const OPOSₒ = OPOS, IPOSₒ = IPOS;

                    // Parse optional leading '-' sign (if signed)...
                    let MAX_NUM = signed ? 0x7FFFFFFF : 0xFFFFFFFF;
                    let isNegative = false;
                    if (signed && IPOS < ILEN && IREP[IPOS] === HYPHEN) {
                        isNegative = true;
                        MAX_NUM = 0x80000000;
                        IPOS += 1;
                    }

                    // ...followed by one or more decimal digits. (NB: no exponents).
                    let digits = 0;
                    while (IPOS < ILEN) {

                        // Read a digit.
                        let c = IREP[IPOS] as number;
                        if (c >= 256) break;
                        const digitValue = DIGIT_VALUES[c];
                        if (digitValue >= base) break;

                        // Update parsed number.
                        num *= base;
                        num += digitValue;

                        // Check for overflow.
                        if (num > MAX_NUM) return OPOS = OPOSₒ, IPOS = IPOSₒ, false;

                        // Loop again.
                        IPOS += 1;
                        digits += 1;
                    }

                    // Check that we parsed at least one digit.
                    if (digits === 0) return OPOS = OPOSₒ, IPOS = IPOSₒ, false;

                    // Apply the sign.
                    if (isNegative) num = -num;

                    // Success
                    OREP[OPOS++] = num;
                    ATYP |= SCALAR;
                    return true;
                },

                infer: function ISTR() {
                    OREP[OPOS++] = 0;
                    ATYP |= SCALAR;
                },
            },
            print: {
                full: function ISTR() {
                    const digits = [] as number[];
                    if (ATYP !== SCALAR) return false;
                    let num = IREP[IPOS] as number;
                    if (typeof num !== 'number') return false;

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
                    while (true) {
                        const d = num % base;
                        num = (num / base) | 0;
                        digits.push(CHAR_CODES[d]);
                        if (num === 0) break;
                    }

                    // Compute the final string.
                    IPOS += 1;
                    if (isNegative) digits.push(HYPHEN);

                    // Success
                    for (let i = 0; i < digits.length; ++i) {
                        OREP[OPOS++] = digits[i];
                    }
                    return true;
                },
                infer: function ISTR() {
                    OREP[OPOS++] = CHAR_CODES[0];
                },
            },
        });
    };
}


// TODO: doc...
// use this for bases between 2-36. Get the charCode, ensure < 256, look up DIGIT_VALUES[code], ensure < BASE
// NB: the number 80 is not special, it's just greater than 36 which makes it a sentinel for 'not a digit'.
const DIGIT_VALUES = [
    80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, // 00-0f
    80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, // 10-1f
    80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, // 20-2f
    0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 80, 80, 80, 80, 80, 80,  // 30-3f
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

const HYPHEN = 0x2d;
