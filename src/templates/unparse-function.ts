type Unparser = (ast: unknown, pos: number, result: {src: string, posᐟ: number}) => boolean;
declare const start: Unparser;




export function unparse(ast: unknown): string {
    // @ts-ignore 7028 unused label
    placeholder: {}

    //debugger;
    let result = {src: '', posᐟ: 0};
    if (!start(ast, 0, result)) throw new Error(`parse failed`);
    if (!isFullyConsumed(ast, result.posᐟ)) throw new Error(`unparse didn't consume entire input`);
    return result.src;
}




// ---------- wip... ----------
export function Memo(expr: Unparser): Unparser {

    // TODO: revise memo key once using new ast/pos signature
    const FAIL = '\uD800'; // NB: this is an invalid code point (lead surrogate with no pair). It is used as a sentinel.
    const memos = new Map<
        unknown,
        Map<
            number,
            {resolved: boolean, isLeftRecursive: boolean, result: {src: string, posᐟ: number}}
        >
    >();
    return (ast, pos, result) => {

        // Check whether the memo table already has an entry for the given initial state.
        let memos2 = memos.get(ast);
        if (memos2 === undefined) memos.set(ast, memos2 = new Map());
        let memo = memos2.get(pos);
        if (!memo) {
            // The memo table does *not* have an entry, so this is the first attempt to apply this rule with this
            // initial state. The first thing we do is create a memo table entry, which is marked as *unresolved*.
            // All future applications of this rule with the same initial state will find this memo. If a future
            // application finds the memo still unresolved, then we know we have encountered left-recursion.
            memo = {resolved: false, isLeftRecursive: false, result: {src: FAIL, posᐟ: 0}};
            memos2.set(pos, memo);

            // Now that the unresolved memo is in place, apply the rule, and resolve the memo with the result. At
            // this point, any left-recursive paths encountered during application are guaranteed to have been noted
            // and aborted (see below).
            if (!expr(ast, pos, memo.result)) memo.result.src = FAIL;
            memo.resolved = true;

            // If we did *not* encounter left-recursion, then we have simple memoisation, and the result is final.
            if (!memo.isLeftRecursive) {
                Object.assign(result, memo.result);
                return result.src !== FAIL;
            }

            // If we get here, then the above application of the rule invoked itself left-recursively, but we
            // aborted the left-recursive paths (see below). That means that the result is either failure, or
            // success via a non-left-recursive path through the rule. We now iterate, repeatedly re-applying the
            // same rule with the same initial state. We continue to iterate as long as the application succeeds
            // and consumes more input than the previous iteration did, in which case we update the memo with the
            // new result. We thus 'grow' the result, stopping when application either fails or does not consume
            // more input, at which point we take the result of the previous iteration as final.
            while (memo.result.src !== FAIL) {
                if (!expr(ast, pos, result)) result.src = FAIL;

                // TODO: break cases:
                // anything --> same thing (covers all string cases, since they can only be same or shorter)
                // some node --> some different non-empty node (assert: should never happen!)
                if (result.src === FAIL) break;
                if (result.posᐟ === memo.result.posᐟ) break;
                if (!isFullyConsumed(ast, result.posᐟ)) break;
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
        return result.src !== FAIL;
    };
}




// ---------- built-in parser combinators ----------
export function Selection(...expressions: Unparser[]): Unparser {
    const arity = expressions.length;
    return (ast, pos, result) => {
        for (let i = 0; i < arity; ++i) {
            if (expressions[i](ast, pos, result)) return true;
        }
        return false;
    };
}

export function Sequence(...expressions: Unparser[]): Unparser {
    const arity = expressions.length;
    return (ast, pos, result) => {
        let src = '';
        for (let i = 0; i < arity; ++i) {
            if (!expressions[i](ast, pos, result)) return false;
            src += result.src;
            pos = result.posᐟ;
        }
        result.src = src;
        result.posᐟ = pos;
        return true;
    };
}

type Field =
    | {type: 'static', name: string, value: Unparser}
    | {type: 'computed', name: Unparser, value: Unparser}
    | {type: 'spread', expr: Unparser};
export function Record(fields: Field[]): Unparser {
    return (ast, pos, result) => {
        let src = '';
        if (!isPlainObject(ast)) return false;

        // TODO: ...
        outerLoop:
        for (let field of fields) {
            if (field.type === 'spread') {
                // TODO: ...
                if (!field.expr(ast, pos, result)) return false;
                src += result.src;
                pos = result.posᐟ;
            }
            else {
                // Find the first property key/value pair that matches this field name/value pair (if any)
                let propNames = Object.keys(ast);
                let propCount = propNames.length;
                assert(propCount <= 32);
                for (let i = 0; i < propCount; ++i) {
                    let propName = propNames[i];

                    // TODO: skip already-consumed key/value pairs
                    const posIncrement = 1 << i;
                    if ((pos & posIncrement) !== 0) continue;

                    // TODO: match field name
                    if (field.type === 'computed') {
                        if (!field.name(propName, 0, result)) continue;
                        if (result.posᐟ !== propName.length) continue;
                        src += result.src;
                    }
                    else /* field.type === 'static' */ {
                        if (propName !== field.name) continue;
                    }

                    // TODO: match field value
                    if (!field.value((ast as any)[propName], 0, result)) continue;
                    if (!isFullyConsumed((ast as any)[propName], result.posᐟ)) continue;
                    src += result.src;

                    // TODO: we matched both name and value - consume them from ast
                    pos += posIncrement;
                    continue outerLoop;
                }

                // If we get here, no match...
                return false;
            }
        }
        result.src = src;
        result.posᐟ = pos;
        return true;
    };
}

type ListElement =
    | {type: 'element', value: Unparser}
    | {type: 'spread', expr: Unparser};
export function List(elements: ListElement[]): Unparser {
    return (ast, pos, result) => {
        let src = '';
        if (!Array.isArray(ast)) return false;

        for (let element of elements) {
            if (element.type === 'spread') {
                if (!element.expr(ast, pos, result)) return false;
                src += result.src;
                pos = result.posᐟ;
            }
            else /* element.type === 'element' */{
                if (pos >= ast.length) return false;
                if (!element.value(ast[pos], 0, result)) return false;
                if (!isFullyConsumed(ast[pos], result.posᐟ)) return false;
                src += result.src;
                pos += 1;
            }
        }
        result.src = src;
        result.posᐟ = pos;
        return true;
    };
}




// ---------- built-in parser factories ----------
export function AbstractCharRange(min: string, max: string): Unparser {
    return (ast, pos, result) => {
        if (typeof ast !== 'string' || pos >= ast.length) return false;
        let c = ast.charAt(pos);
        if (c < min || c > max) return false;
        result.src = '';
        result.posᐟ = pos + 1;
        return true;
    };
}

export function ConcreteCharRange(min: string, max: string): Unparser {
    [max]; // prevent 6133 unused decl
    return (_, pos, result) => {
        result.src = min;
        result.posᐟ = pos;
        return true;
    };
}

export function UniformCharRange(min: string, max: string): Unparser {
    return (ast, pos, result) => {
        if (typeof ast !== 'string' || pos >= ast.length) return false;
        let c = ast.charAt(pos);
        if (c < min || c > max) return false;
        result.src = c;
        result.posᐟ = pos + 1;
        return true;
    };
}

export function AbstractStringLiteral(value: string): Unparser {
    return (ast, pos, result) => {
        if (typeof ast !== 'string' || !matchesAt(ast, value, pos)) return false;
        result.src = '';
        result.posᐟ = pos + value.length;
        return true;
    };
}

export function ConcreteStringLiteral(value: string): Unparser {
    return (_, pos, result) => {
        result.src = value;
        result.posᐟ = pos;
        return true;
    };
}

export function UniformStringLiteral(value: string): Unparser {
    return (ast, pos, result) => {
        if (typeof ast !== 'string' || !matchesAt(ast, value, pos)) return false;
        result.src = value;
        result.posᐟ = pos + value.length;
        return true;
    };
}




// ---------- other built-ins ----------
export function i32(ast: unknown, pos: number, result: {src: string, posᐟ: number}) {

    // TODO: ensure N is a 32-bit integer
    if (typeof ast !== 'number' || pos !== 0) return false;
    let num = ast;
    if ((num & 0xFFFFFFFF) !== num) return false;

    // TODO: check sign...
    let isNegative = false;
    if (num < 0) {
        isNegative = true;
        if (num === -2147483648) {
            // Specially handle the one case where N = -N could overflow
            result.src = '-2147483648';
            result.posᐟ = 1;
            return true;
        }
        num = -num as number;
    }

    // TODO: ...then digits
    let digits = [] as string[];
    while (true) {
        let d = num % 10;
        num = (num / 10) | 0;
        digits.push(String.fromCharCode(UNICODE_ZERO_DIGIT + d));
        if (num === 0) break;
    }

    // TODO: compute final string...
    if (isNegative) digits.push('-');
    result.src = digits.reverse().join('');
    result.posᐟ = 1;
    return true;
}

// These constants are used by the i32 unparser.
const UNICODE_ZERO_DIGIT = '0'.charCodeAt(0);




export function char(ast: unknown, pos: number, result: {src: string, posᐟ: number}) {
    if (typeof ast !== 'string' || pos >= ast.length) return false;
    result.src = ast.charAt(pos);
    result.posᐟ = pos + 1;
    return true;
}




// TODO: where do these ones belong?
export function intrinsic_true(ast: unknown, pos: number, result: {src: string, posᐟ: number}) {
    if (ast !== true || pos !== 0) return false;
    result.src = '';
    result.posᐟ = 1;
    return true;
}

export function intrinsic_false(ast: unknown, pos: number, result: {src: string, posᐟ: number}) {
    if (ast !== false || pos !== 0) return false;
    result.src = '';
    result.posᐟ = 1;
    return true;
}

export function intrinsic_null(ast: unknown, pos: number, result: {src: string, posᐟ: number}) {
    if (ast !== null || pos !== 0) return false;
    result.src = '';
    result.posᐟ = 1;
    return true;
}

export function ZeroOrMore(expression: Unparser): Unparser {
    return (ast, pos, result) => {
        // TODO: temp testing... this requires incrementally consuming from N, which we only know how to do
        // if N is a string. Since iteration doesn't make sense (for now?) with objects or lists, but ZeroOrMore
        // should *always* succeed, in non-string cases we just consume nothing and return success.
        // Investigate if the above summary is complete and correct in all cases. Any counterexamples that should
        // be handled differently? Eg iterating *one time* to consume an object or list as a whole? Or would we
        // make that a type error when we add type-checking?
        if (typeof ast !== 'string') {
            result.src = '';
            result.posᐟ = pos;
            return true;
        }

        let src = '';
        while (true) {
            if (!expression(ast, pos, result)) break;

            // TODO: check if any input was consumed... if not, return with zero iterations, since otherwise
            // we would loop forever. Change to one iteration as 'canonical' / more useful behaviour? Why (not)?
            if (pos === result.posᐟ) break;
            src += result.src;
            pos = result.posᐟ;
        }

        result.src = src;
        result.posᐟ = pos;
        return true;
    };
}

export function Maybe(expression: Unparser): Unparser {
    return (ast, pos, result) => {
        if (expression(ast, pos, result)) return true;
        return epsilon(ast, pos, result);
    };
}

export function Not(expression: Unparser): Unparser {
    return (ast, pos, result) => {
        if (expression(ast, pos, result)) return false;
        return epsilon(ast, pos, result);
    };
}

export function epsilon(_: unknown, pos: number, result: {src: string, posᐟ: number}) {
    result.src = '';
    result.posᐟ = pos;
    return true;
}




// TODO: internal helpers...
function isFullyConsumed(ast: unknown, pos: number) {
    if (typeof ast === 'string') return pos === ast.length;
    if (Array.isArray(ast)) return pos === ast.length;
    if (isPlainObject(ast)) {
        let keyCount = Object.keys(ast).length;
        assert(keyCount <= 32);
        if (keyCount === 0) return true;
        return pos = -1 >>> (32 - keyCount);
    }
    return pos === 1;
}

function isPlainObject(value: unknown): value is object {
    return value !== null && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype;
}

// TODO: this is copypasta - same fn is in parse template
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
