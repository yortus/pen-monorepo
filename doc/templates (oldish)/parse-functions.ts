const NO_NODE = Symbol('NoNode');
type Parser = (src: string, pos: number, result: {ast: unknown, posᐟ: number}) => boolean;
declare const start: Parser;




export function parse(text: string): unknown {
    // @ts-ignore 7028 unused label
    placeholder: {}

    //debugger;
    let result = {ast: null, posᐟ: 0};
    if (!start(text, 0, result)) throw new Error(`parse failed`);
    if (result.posᐟ !== text.length) throw new Error(`parse didn't consume entire input`);
    if (result.ast === NO_NODE) throw new Error(`parse didn't return a value`);
    return result.ast;
}




// ---------- wip... ----------
export function Memo(expr: Parser): Parser {

    // TODO: investigate... need to use `text` as part of memo key? Study lifecycle/extent of each `memos` instance.
    const FAIL = Symbol('FAIL');
    const memos = new Map<
        number,
        {resolved: boolean, isLeftRecursive: boolean, result: {ast: unknown, posᐟ: number}}
    >();
    return (src, pos, result) => {
        // Check whether the memo table already has an entry for the given initial state.
        let memo = memos.get(pos);
        if (!memo) {
            // The memo table does *not* have an entry, so this is the first attempt to apply this rule with this
            // initial state. The first thing we do is create a memo table entry, which is marked as *unresolved*.
            // All future applications of this rule with the same initial state will find this memo. If a future
            // application finds the memo still unresolved, then we know we have encountered left-recursion.
            memo = {resolved: false, isLeftRecursive: false, result: {ast: FAIL, posᐟ: 0}};
            memos.set(pos, memo);

            // Now that the unresolved memo is in place, apply the rule, and resolve the memo with the result. At
            // this point, any left-recursive paths encountered during application are guaranteed to have been noted
            // and aborted (see below).
            if (!expr(src, pos, memo.result)) memo.result.ast = FAIL;
            memo.resolved = true;

            // If we did *not* encounter left-recursion, then we have simple memoisation, and the result is final.
            if (!memo.isLeftRecursive) {
                Object.assign(result, memo.result);
                return result.ast !== FAIL;
            }

            // If we get here, then the above application of the rule invoked itself left-recursively, but we
            // aborted the left-recursive paths (see below). That means that the result is either failure, or
            // success via a non-left-recursive path through the rule. We now iterate, repeatedly re-applying the
            // same rule with the same initial state. We continue to iterate as long as the application succeeds
            // and consumes more input than the previous iteration did, in which case we update the memo with the
            // new result. We thus 'grow' the result, stopping when application either fails or does not consume
            // more input, at which point we take the result of the previous iteration as final.
            while (memo.result.ast !== FAIL) {
                if (!expr(src, pos, result)) result.ast = FAIL;
                if (result.ast === FAIL || result.posᐟ <= memo.result.posᐟ) break;
                Object.assign(memo.result, result);
            }
        }
        else if (!memo.resolved) {
            // If we get here, then we have already applied the rule with this initial state, but not yet resolved
            // it. That means we must have entered a left-recursive path of the rule. All we do here is note that
            // the rule application encountered left-recursion, and return with failure. This means that the initial
            // application of the rule for this initial state can only possibly succeed along a non-left-recursive
            // path. More importantly, it means the parser will never loop endlessly on left-recursive rules.
            memo.isLeftRecursive = true;
            return false;
        }

        // We have a resolved memo, so the result of the rule application for the given initial state has already
        // been computed. Return it from the memo.
        Object.assign(result, memo.result);
        return result.ast !== FAIL;
    };
}




// ---------- built-in parser combinators ----------
export function Selection(...expressions: Parser[]): Parser {
    const arity = expressions.length;
    return (src, pos, result) => {
        for (let i = 0; i < arity; ++i) {
            if (expressions[i](src, pos, result)) return true;
        }
        return false;
    };
}

export function Sequence(...expressions: Parser[]): Parser {
    const arity = expressions.length;
    return (src, pos, result) => {
        let ast: unknown = NO_NODE;
        for (let i = 0; i < arity; ++i) {
            if (!expressions[i](src, pos, result)) return false;
            pos = result.posᐟ;
            if (ast === NO_NODE) ast = result.ast;
            else if (typeof ast === 'string' && typeof result.ast === 'string') ast += result.ast;
            else if (Array.isArray(ast) && Array.isArray(result.ast)) ast = [...ast, ...result.ast];
            else if (isPlainObject(ast) && isPlainObject(result.ast)) ast = {...ast, ...result.ast};
            else if (result.ast !== NO_NODE) throw new Error(`Internal error: invalid sequence`);
        }
        result.ast = ast;
        result.posᐟ = pos;
        return true;
    };
}

type RecordField = {type: 'static', name: string, value: Parser} | {type: 'computed', name: Parser, value: Parser};
export function Record(fields: RecordField[]): Parser {
    return (src, pos, result) => {
        let obj = {} as any; // TODO: remove/improve cast
        for (let field of fields) {
            let id: string;
            if (field.type === 'computed') {
                if (!field.name(src, pos, result)) return false;
                assert(typeof result.ast === 'string');
                id = result.ast as string;
                pos = result.posᐟ;
            }
            else /* field.type === 'static' */ {
                id = field.name;
            }

            if (!field.value(src, pos, result)) return false;
            assert(result.ast !== NO_NODE);
            obj[id] = result.ast;
            pos = result.posᐟ;
        }
        result.ast = obj;
        result.posᐟ = pos;
        return true;
    };
}

interface ListElement { type: 'element'; value: Parser; }
export function List(elements: ListElement[]): Parser {
    return (src, pos, result) => {
        let arr = [] as Array<unknown>;
        for (let element of elements) {
            if (!element.value(src, pos, result)) return false;
            assert(result.ast !== NO_NODE);
            arr.push(result.ast);
            pos = result.posᐟ;
        }
        result.ast = arr;
        result.posᐟ = pos;
        return true;
    };
}




// ---------- built-in parser factories ----------
export function AbstractCharRange(min: string, max: string): Parser {
    [max]; // prevent 6133 unused decl
    return (_, pos, result) => {
        result.ast = min;
        result.posᐟ = pos;
        return true;
    };
}

export function ConcreteCharRange(min: string, max: string): Parser {
    return (src, pos, result) => {
        if (pos >= src.length) return false;
        let c = src.charAt(pos);
        if (c < min || c > max) return false;
        result.ast = NO_NODE;
        result.posᐟ = pos + 1;
        return true;
    };
}

export function UniformCharRange(min: string, max: string): Parser {
    return (src, pos, result) => {
        if (pos >= src.length) return false;
        let c = src.charAt(pos);
        if (c < min || c > max) return false;
        result.ast = c;
        result.posᐟ = pos + 1;
        return true;
    };
}

export function AbstractStringLiteral(value: string): Parser {
    return (_, pos, result) => {
        result.ast = value;
        result.posᐟ = pos;
        return true;
    };
}

export function ConcreteStringLiteral(value: string): Parser {
    return (src, pos, result) => {
        if (!matchesAt(src, value, pos)) return false;
        result.ast = NO_NODE;
        result.posᐟ = pos + value.length;
        return true;
    };
}

export function UniformStringLiteral(value: string): Parser {
    return (src, pos, result) => {
        if (!matchesAt(src, value, pos)) return false;
        result.ast = value;
        result.posᐟ = pos + value.length;
        return true;
    };
}




// ---------- other built-ins ----------
export function i32(src: string, pos: number, result: {ast: unknown, posᐟ: number}) {

    // Parse optional leading '-' sign...
    let isNegative = false;
    if (pos < src.length && src.charAt(pos) === '-') {
        isNegative = true;
        pos += 1;
    }

    // ...followed by one or more decimal digits. (NB: no exponents).
    let num = 0;
    let digits = 0;
    while (pos < src.length) {

        // Read a digit
        let c = src.charCodeAt(pos);
        if (c < UNICODE_ZERO_DIGIT || c > UNICODE_ZERO_DIGIT + 9) break;

        // Check for overflow
        if (num > ONE_TENTH_MAXINT32) {
            return false;
        }

        // Update parsed number
        num *= 10;
        num += (c - UNICODE_ZERO_DIGIT);
        pos += 1;
        digits += 1;
    }

    // Check that we parsed at least one digit.
    if (digits === 0) return false;

    // Apply the sign.
    if (isNegative) num = -num;

    // Check for over/under-flow. This *is* needed to catch -2147483649, 2147483648 and 2147483649.
    if (isNegative ? (num & 0xFFFFFFFF) >= 0 : (num & 0xFFFFFFFF) < 0) return false;

    // Success
    result.ast = num;
    result.posᐟ = pos;
    return true;
}

// These constants are used by the i32 parser.
const UNICODE_ZERO_DIGIT = '0'.charCodeAt(0);
const ONE_TENTH_MAXINT32 = 0x7FFFFFFF / 10;




export function char(src: string, pos: number, result: {ast: unknown, posᐟ: number}) {
    if (pos >= src.length) return false;
    result.ast = src.charAt(pos);
    result.posᐟ = pos + 1;
    return true;
}




// TODO: where do these ones belong?
export function intrinsic_true(_: string, pos: number, result: {ast: unknown, posᐟ: number}) {
    result.ast = true;
    result.posᐟ = pos;
    return true;
}

export function intrinsic_false(_: string, pos: number, result: {ast: unknown, posᐟ: number}) {
    result.ast = false;
    result.posᐟ = pos;
    return true;
}

export function intrinsic_null(_: string, pos: number, result: {ast: unknown, posᐟ: number}) {
    result.ast = null;
    result.posᐟ = pos;
    return true;
}

export function ZeroOrMore(expression: Parser): Parser {
    return (src, pos, result) => {
        let ast: unknown = NO_NODE;
        while (true) {
            if (!expression(src, pos, result)) break;

            // TODO: check if any input was consumed... if not, stop iterating, since otherwise we may loop loop forever
            if (pos === result.posᐟ) break;

            // TODO: copypasta from Sequence above... make DRY
            pos = result.posᐟ;
            if (ast === NO_NODE) ast = result.ast;
            else if (typeof ast === 'string' && typeof result.ast === 'string') ast += result.ast;
            else if (Array.isArray(ast) && Array.isArray(result.ast)) ast = [...ast, ...result.ast];
            else if (isPlainObject(ast) && isPlainObject(result.ast)) ast = {...ast, ...result.ast};
            else if (result.ast !== NO_NODE) throw new Error(`Internal error: invalid sequence`);
        }

        result.ast = ast;
        result.posᐟ = pos;
        return true;
    };
}

export function Maybe(expression: Parser): Parser {
    return (src, pos, result) => {
        if (expression(src, pos, result)) return true;
        return epsilon(src, pos, result);
    };
}

export function Not(expression: Parser): Parser {
    return (src, pos, result) => {
        if (expression(src, pos, result)) return false;
        return epsilon(src, pos, result);
    };
}

export function epsilon(_: string, pos: number, result: {ast: unknown, posᐟ: number}) {
    result.ast = NO_NODE;
    result.posᐟ = pos;
    return true;
}




// TODO: internal helpers...
function isPlainObject(value: unknown): value is object {
    return value !== null && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype;
}

function matchesAt(text: string, substr: string, position: number) {
    let lastPos = position + substr.length;
    if (lastPos > text.length) return false;
    for (let i = position, j = 0; i < lastPos; ++i, ++j) {
        if (text.charAt(i) !== substr.charAt(j)) return false;
    }
    return true;
}

function assert(value: unknown) {
    if (!value) throw new Error(`Assertion failed`);
}
