// type Span = string;
const NO_NODE = Symbol('NoNode');
// const FAIL = '\uD800'; // NB: this is an invalid code point (lead surrogate with no pair). It is used as a sentinel.
// type Duad = {S: Span, N: unknown} | {S: typeof FAIL, N: unknown};
// type Transcoder = (N: unknown) => Duad;
// declare const start: Transcoder;




// TODO: temp testing...
type Unparser = (ast: unknown, result: {src: string, astᐟ: unknown}) => boolean;
declare const start: Unparser;




export function unparse(ast: unknown): string {
    // @ts-ignore 7028 unused label
    placeholder: {}

    //debugger;
    let result = {src: '', astᐟ: null};
    if (!start(ast, result)) throw new Error(`parse failed`);
    if (!isFullyConsumed(result.astᐟ)) throw new Error(`unparse didn't consume entire input`);
    return result.src;
}




// ---------- wip... ----------
export function Memo(expr: Unparser): Unparser {

    // TODO: revise memo key once using new ast/pos signature
    const FAIL = Symbol('FAIL');
    const memos = new Map<
        unknown,
        {resolved: boolean, isLeftRecursive: boolean, result: {src: string, astᐟ: unknown}}
    >();
    return (ast, result) => {
        // Check whether the memo table already has an entry for the given initial state.
        let memo = memos.get(ast);
        if (!memo) {
            // The memo table does *not* have an entry, so this is the first attempt to apply this rule with this
            // initial state. The first thing we do is create a memo table entry, which is marked as *unresolved*.
            // All future applications of this rule with the same initial state will find this memo. If a future
            // application finds the memo still unresolved, then we know we have encountered left-recursion.
            memo = {resolved: false, isLeftRecursive: false, result: {src: '', astᐟ: FAIL}};
            memos.set(ast, memo);

            // Now that the unresolved memo is in place, apply the rule, and resolve the memo with the result. At
            // this point, any left-recursive paths encountered during application are guaranteed to have been noted
            // and aborted (see below).
            if (!expr(ast, memo.result)) memo.result.astᐟ = FAIL;
            memo.resolved = true;

            // If we did *not* encounter left-recursion, then we have simple memoisation, and the result is final.
            if (!memo.isLeftRecursive) {
                Object.assign(result, memo.result);
                return result.astᐟ !== FAIL;
            }

            // If we get here, then the above application of the rule invoked itself left-recursively, but we
            // aborted the left-recursive paths (see below). That means that the result is either failure, or
            // success via a non-left-recursive path through the rule. We now iterate, repeatedly re-applying the
            // same rule with the same initial state. We continue to iterate as long as the application succeeds
            // and consumes more input than the previous iteration did, in which case we update the memo with the
            // new result. We thus 'grow' the result, stopping when application either fails or does not consume
            // more input, at which point we take the result of the previous iteration as final.
            while (memo.result.astᐟ !== FAIL) {
                if (!expr(ast, result)) result.astᐟ = FAIL;

                // TODO: break cases:
                // anything --> same thing (covers all string cases, since they can only be same or shorter)
                // NO_NODE --> anything
                // some node --> some different non-empty node (assert: should never happen!)
                if (result.astᐟ === FAIL) break;
                if (result.astᐟ === memo.result.astᐟ) break;
                if (memo.result.astᐟ === NO_NODE) break;
                if (result.astᐟ !== NO_NODE) break;
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
        return result.astᐟ !== FAIL;
    };
}




// ---------- built-in parser combinators ----------
export function Selection(...expressions: Unparser[]): Unparser {
    const arity = expressions.length;
    return (ast, result) => {
        for (let i = 0; i < arity; ++i) {
            if (expressions[i](ast, result)) return true;
        }
        return false;
    };
}

export function Sequence(...expressions: Unparser[]): Unparser {
    const arity = expressions.length;
    return (ast, result) => {
        let src = '';
        for (let i = 0; i < arity; ++i) {
            if (!expressions[i](ast, result)) return false;
            assert(isResidualNode(ast, result.astᐟ)); // TODO: this expensive check should be enabled only in debug mode
                                                      //      Also it should be wrapped around *all* unparse calls since
                                                      //      it is an invariant of unparsing.
            src += result.src;
            ast = result.astᐟ;
        }
        result.src = src;
        result.astᐟ = ast;
        return true;
    };
}

type Field =
    | {type: 'static', name: string, value: Unparser}
    | {type: 'computed', name: Unparser, value: Unparser}
    | {type: 'spread', expr: Unparser};
export function Record(fields: Field[]): Unparser {
    return (ast, result) => {
        let src = '';
        if (!isPlainObject(ast)) return false;
        let obj = ast;

        // Make a copy of obj from which we delete key/value pairs once they are consumed
        obj = {...obj};

        // TODO: ...
        outerLoop:
        for (let field of fields) {
            if (field.type === 'spread') {
                // TODO: ...
                if (!field.expr(obj, result)) return false;
                assert(isResidualNode(obj, result.astᐟ)); // TODO: see comment in Sequence() re isResidualNode
                src += result.src;
                obj = {...result.astᐟ as object};
            }
            else {
                // Find the first property key/value pair that matches this field name/value pair (if any)
                let propNames = Object.keys(obj);
                for (let propName of propNames) {
                    if (field.type === 'computed') {
                        if (!field.name(propName, result)) continue;
                        if (result.astᐟ !== '') continue;
                        src += result.src;
                    }
                    else /* field.type === 'static' */ {
                        if (propName !== field.name) continue;
                    }

                    // TODO: match value
                    if (!field.value((obj as any)[propName], result)) continue;
                    if (!isFullyConsumed(result.astᐟ)) continue;
                    src += result.src;

                    // TODO: we matched both name and value - consume them from obj
                    delete (obj as any)[propName];
                    continue outerLoop;
                }

                // If we get here, no match...
                return false;
            }
        }
        result.src = src;
        result.astᐟ = obj;
        return true;
    };
}

type ListElement =
    | {type: 'element', value: Unparser}
    | {type: 'spread', expr: Unparser};
export function List(elements: ListElement[]): Unparser {
    return (ast, result) => {
        let src = '';
        if (!Array.isArray(ast)) return false;
        let arr = ast;

        for (let element of elements) {
            if (element.type === 'spread') {
                if (!element.expr(arr, result)) return false;
                assert(isResidualNode(arr, result.astᐟ)); // TODO: see comment in Sequence() re isResidualNode
                src += result.src;
                arr = result.astᐟ as any[];
            }
            else /* element.type === 'element' */{
                if (arr.length === 0) return false;
                if (!element.value(arr[0], result)) return false;
                if (!isFullyConsumed(result.astᐟ)) return false;
                src += result.src;
                arr = arr.slice(1);
            }
        }
        result.src = src;
        result.astᐟ = arr;
        return true;
    };
}




// // ---------- built-in parser factories ----------
export function AbstractCharRange(min: string, max: string): Unparser {
    return (ast, result) => {
        if (typeof ast !== 'string' || ast.length === 0) return false;
        let c = ast.charAt(0);
        if (c < min || c > max) return false;
        result.src = '';
        result.astᐟ = ast.slice(1);
        return true;
    };
}

export function ConcreteCharRange(min: string, max: string): Unparser {
    [max]; // prevent 6133 unused decl
    return (ast, result) => {
        result.src = min;
        result.astᐟ = ast;
        return true;
    };
}

export function UniformCharRange(min: string, max: string): Unparser {
    return (ast, result) => {
        if (typeof ast !== 'string' || ast.length === 0) return false;
        let c = ast.charAt(0);
        if (c < min || c > max) return false;
        result.src = c;
        result.astᐟ = ast.slice(1);
        return true;
    };
}

export function AbstractStringLiteral(value: string): Unparser {
    return (ast, result) => {
        if (typeof ast !== 'string' || !ast.startsWith(value)) return false;
        result.src = '';
        result.astᐟ = ast.slice(value.length);
        return true;
    };
}

export function ConcreteStringLiteral(value: string): Unparser {
    return (ast, result) => {
        result.src = value;
        result.astᐟ = ast;
        return true;
    };
}

export function UniformStringLiteral(value: string): Unparser {
    return (ast, result) => {
        if (typeof ast !== 'string' || !ast.startsWith(value)) return false;
        result.src = value;
        result.astᐟ = ast.slice(value.length);
        return true;
    };
}




// // ---------- other built-ins ----------
export function i32(ast: unknown, result: {src: string, astᐟ: unknown}) {

    // TODO: ensure N is a 32-bit integer
    if (typeof ast !== 'number') return false;
    let num = ast;
    if ((num & 0xFFFFFFFF) !== num) return false;

    // TODO: check sign...
    let isNegative = false;
    if (num < 0) {
        isNegative = true;
        if (num === -2147483648) {
            // Specially handle the one case where N = -N could overflow
            result.src = '-2147483648';
            result.astᐟ = NO_NODE;
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
    result.astᐟ = NO_NODE;
    return true;
}

// These constants are used by the i32 unparser.
const UNICODE_ZERO_DIGIT = '0'.charCodeAt(0);




export function char(ast: unknown, result: {src: string, astᐟ: unknown}) {
    if (typeof ast !== 'string' || ast.length === 0) return false;
    result.src = ast.charAt(0);
    result.astᐟ = ast.slice(1);
    return true;
}




// // TODO: where do these ones belong?
export function intrinsic_true(ast: unknown, result: {src: string, astᐟ: unknown}) {
    if (ast !== true) return false;
    result.src = '';
    result.astᐟ = NO_NODE;
    return true;
}

export function intrinsic_false(ast: unknown, result: {src: string, astᐟ: unknown}) {
    if (ast !== false) return false;
    result.src = '';
    result.astᐟ = NO_NODE;
    return true;
}

export function intrinsic_null(ast: unknown, result: {src: string, astᐟ: unknown}) {
    if (ast !== null) return false;
    result.src = '';
    result.astᐟ = NO_NODE;
    return true;
}

export function ZeroOrMore(expression: Unparser): Unparser {
    return (ast, result) => {
        // TODO: temp testing... this requires incrementally consuming from N, which we only know how to do
        // if N is a string. Since iteration doesn't make sense (for now?) with objects or lists, but ZeroOrMore
        // should *always* succeed, in non-string cases we just consume nothing and return success.
        // Investigate if the above summary is complete and correct in all cases. Any counterexamples that should
        // be handled differently? Eg iterating *one time* to consume an object or list as a whole? Or would we
        // make that a type error when we add type-checking?
        if (typeof ast !== 'string') {
            result.src = '';
            result.astᐟ = ast;
            return true;
        }

        let src = '';
        while (true) {
            if (!expression(ast, result)) break;

            // TODO: check if any input was consumed... if not, return with zero iterations, since otherwise
            // we would loop forever. Change to one iteration as 'canonical' / more useful behaviour? Why (not)?
            if (ast === result.astᐟ) break;

            assert(isResidualNode(ast, result.astᐟ)); // TODO: this expensive check should be enabled only in debug mode
                                                      //     Also it should be wrapped around *all* unparse calls since
                                                      //     it is an invariant of unparsing.
            src += result.src;
            ast = result.astᐟ;
        }

        result.src = src;
        result.astᐟ = ast;
        return true;
    };
}

export function Maybe(expression: Unparser): Unparser {
    return (ast, result) => {
        if (expression(ast, result)) return true;
        return epsilon(ast, result);
    };
}

export function Not(expression: Unparser): Unparser {
    return (ast, result) => {
        if (expression(ast, result)) return false;
        return epsilon(ast, result);
    };
}

export function epsilon(ast: unknown, result: {src: string, astᐟ: unknown}) {
    result.src = '';
    result.astᐟ = ast;
    return true;
}




// TODO: internal helpers...
function isFullyConsumed(ast: unknown) {
    if (ast === NO_NODE) return true;
    if (ast === '') return true;
    if (isPlainObject(ast) && Object.keys(ast).length === 0) return true;
    if (Array.isArray(ast) && ast.length === 0) return true;
    return false;
}

function isResidualNode(ast: unknown, astʹ: unknown) {
    if (typeof ast === 'string') {
        return typeof astʹ === 'string' && ast.endsWith(astʹ);
    }
    if (isPlainObject(ast)) {
        return isPlainObject(astʹ)
            && Object.keys(astʹ).every(k => ast.hasOwnProperty(k) && (ast as any)[k] === (astʹ as any)[k]);
    }
    if (Array.isArray(ast)) {
        if (!Array.isArray(astʹ)) return false;
        for (let n = astʹ.length, i = ast.length - n, j = 0; j < n; ++i, ++j) {
            if (ast[i] !== astʹ[j]) return false;
        }
        return true;
    }
    return astʹ === ast || astʹ === NO_NODE;
}

function isPlainObject(value: unknown): value is object {
    return value !== null && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype;
}

function assert(value: unknown) {
    if (!value) throw new Error(`Assertion failed`);
}
