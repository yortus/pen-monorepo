type Span = string;
const NO_NODE = Symbol('NoNode');
const FAIL = '\uD800'; // NB: this is an invalid code point (lead surrogate with no pair). It is used as a sentinel.
type Duad = {S: Span, N: unknown} | {S: typeof FAIL, N: unknown};
type Transcoder = (N: unknown) => Duad;
declare const start: Transcoder;




export function unparse(ast: unknown): string {
    // @ts-ignore 7028 unused label
    placeholder: {}

    //debugger;
    let {S, N} = start(ast);
    if (S === FAIL) throw new Error(`unparse failed`);
    if (!isFullyConsumed(N)) throw new Error(`unparse didn't consume entire input`);
    return S;
}



// ---------- wip... ----------
export function Memo(expr: Transcoder): Transcoder {

    // TODO: revise memo key once using new ast/pos signature
    const memos = new Map<
        unknown,
        {resolved: boolean, isLeftRecursive: boolean, result: Duad} // TODO: remove result, add S and N
    >();
    return N => {
        // Check whether the memo table already has an entry for the given initial state.
        let memo = memos.get(N);
        if (!memo) {
            // The memo table does *not* have an entry, so this is the first attempt to apply this rule with this
            // initial state. The first thing we do is create a memo table entry, which is marked as *unresolved*.
            // All future applications of this rule with the same initial state will find this memo. If a future
            // application finds the memo still unresolved, then we know we have encountered left-recursion.
            memo = {resolved: false, isLeftRecursive: false, result: {S: FAIL, N}};
            memos.set(N, memo);

            // Now that the unresolved memo is in place, apply the rule, and resolve the memo with the result. At
            // this point, any left-recursive paths encountered during application are guaranteed to have been noted
            // and aborted (see below).
            memo.result = expr(N);
            memo.resolved = true;

            // If we did *not* encounter left-recursion, then we have simple memoisation, and the result is final.
            if (!memo.isLeftRecursive) return memo.result;

            // If we get here, then the above application of the rule invoked itself left-recursively, but we
            // aborted the left-recursive paths (see below). That means that the result is either failure, or
            // success via a non-left-recursive path through the rule. We now iterate, repeatedly re-applying the
            // same rule with the same initial state. We continue to iterate as long as the application succeeds
            // and consumes more input than the previous iteration did, in which case we update the memo with the
            // new result. We thus 'grow' the result, stopping when application either fails or does not consume
            // more input, at which point we take the result of the previous iteration as final.
            while (memo.result.S !== FAIL) {
                let nextResult = expr(N);

                // TODO: break cases:
                // anything --> same thing (covers all string cases, since they can only be same or shorter)
                // NO_NODE --> anything
                // some node --> some different non-empty node (assert: should never happen!)
                if (nextResult.S === FAIL) break;
                if (nextResult.N === memo.result.N) break;
                if (memo.result.N === NO_NODE) break;
                if (nextResult.N !== NO_NODE) break;
                memo.result = nextResult;
            }
        }
        else if (!memo.resolved) {
            // If we get here, then we have already applied the rule with this initial state, but not yet resolved
            // it. That means we must have entered a left-recursive path of the rule. All we do here is note that
            // the rule application encountered left-recursion, and return with failure. This means that the initial
            // application of the rule for this initial state can only possibly succeed along a non-left-recursive
            // path. More importantly, it means the parser will never loop endlessly on left-recursive rules.
            memo.isLeftRecursive = true;
            return {S: FAIL, N};
        }

        // We have a resolved memo, so the result of the rule application for the given initial state has already
        // been computed. Return it from the memo.
        return memo.result;
    };
}




// ---------- built-in parser combinators ----------
export function Selection(...expressions: Transcoder[]): Transcoder {
    const arity = expressions.length;
    return N => {
        for (let i = 0; i < arity; ++i) {
            let result = expressions[i](N);
            if (result.S !== FAIL) return result;
        }
        return {S: FAIL, N};
    };
}

export function Sequence(...expressions: Transcoder[]): Transcoder {
    const arity = expressions.length;
    return N => {
        let S: Span = '';
        for (let i = 0; i < arity; ++i) {
            let result = expressions[i](N);
            if (result.S === FAIL) return result;
            assert(isResidualNode(N, result.N)); // TODO: this expensive check should be enabled only in debug mode.
                                                    //       Also it should be wrapped around *all* unparse calls since
                                                    //       it is an invariant of unparsing.
            S += result.S;
            N = result.N;
        }
        return {S, N};
    };
}

type Field =
    | {type: 'static', name: string, value: Transcoder}
    | {type: 'computed', name: Transcoder, value: Transcoder}
    | {type: 'spread', expr: Transcoder};
export function Record(fields: Field[]): Transcoder {
    return N => {
        let S = '';
        if (!isPlainObject(N)) return {S: FAIL, N};

        // Make a copy of N from which we delete key/value pairs once they are consumed
        N = {...N};

        // TODO: ...
        outerLoop:
        for (let field of fields) {
            if (field.type === 'spread') {
                // TODO: ...
                let result = field.expr(N);
                if (result.S === FAIL) return result;
                assert(isResidualNode(N, result.N)); // TODO: see comment in Sequence() re isResidualNode
                S += result.S;
                N = {...result.N as object};
            }
            else {

                // Find the first property key/value pair that matches this field name/value pair (if any)
                let propNames = Object.keys(N as object);
                for (let propName of propNames) {
                    if (field.type === 'computed') {
                        let r = field.name(propName);
                        if (r.S === FAIL || r.N !== '') continue;
                        S += r.S;
                    }
                    else /* field.type === 'static' */ {
                        if (propName !== field.name) continue;
                    }

                    // TODO: match value
                    let result = field.value((N as any)[propName]);
                    if (result.S === FAIL) continue;
                    if (!isFullyConsumed(result.N)) continue;
                    S += result.S;

                    // TODO: we matched both name and value - consume them from N
                    delete (N as any)[propName];
                    continue outerLoop;
                }

                // If we get here, no match...
                return {S: FAIL, N};
            }
        }
        return {S, N};
    };
}

type ListElement =
    | {type: 'element', value: Transcoder}
    | {type: 'spread', expr: Transcoder};
export function List(elements: ListElement[]): Transcoder {
    return N => {
        let S = '';
        if (!Array.isArray(N)) return {S: FAIL, N};

        // TODO: was... for records... can just slice arrays
        // // Make a copy of N from which we slice off elements once they are consumed
        // N = {...N};

        // TODO: ... fix casts in code below
        for (let element of elements) {
            if (element.type === 'spread') {
                let result = element.expr(N);
                if (result.S === FAIL) return result;
                assert(isResidualNode(N, result.N)); // TODO: see comment in Sequence() re isResidualNode
                S += result.S;
                N = result.N as any[];
            }
            else /* element.type === 'element' */{
                if ((N as any[]).length === 0) return {S: FAIL, N};
                let result = element.value((N as any[])[0]);
                if (result.S === FAIL) return result;
                if (!isFullyConsumed(result.N)) return {S: FAIL, N};
                S += result.S;
                N = (N as any[]).slice(1);
            }
        }
        return {S, N};
    };
}




// ---------- built-in parser factories ----------
export function AbstractCharRange(min: string, max: string): Transcoder {
    return N => {
        if (typeof N !== 'string' || N.length === 0) return {S: FAIL, N};
        let c = N.charAt(0);
        if (c < min || c > max) return {S: FAIL, N};
        return {S: '', N: N.slice(1)};
    };
}

export function ConcreteCharRange(min: string, max: string): Transcoder {
    [max]; // prevent 6133 unused decl
    return N => {
        return {S: min, N};
    };
}

export function UniformCharRange(min: string, max: string): Transcoder {
    return N => {
        if (typeof N !== 'string' || N.length === 0) return {S: FAIL, N};
        let c = N.charAt(0);
        if (c < min || c > max) return {S: FAIL, N};
        return {S: c, N: N.slice(1)};
    };
}

export function AbstractStringLiteral(value: string): Transcoder {
    return N => {
        if (typeof N !== 'string' || !N.startsWith(value)) return {S: FAIL, N};
        return {S: '', N: N.slice(value.length)};
    };
}

export function ConcreteStringLiteral(value: string): Transcoder {
    return N => {
        return {S: value, N};
    };
}

export function UniformStringLiteral(value: string): Transcoder {
    return N => {
        if (typeof N !== 'string' || !N.startsWith(value)) return {S: FAIL, N};
        return {S: value, N: N.slice(value.length)};
    };
}




// ---------- other built-ins ----------
export function i32(N: number): Duad {

    // TODO: ensure N is a 32-bit integer
    if (typeof N !== 'number') return {S: FAIL, N};
    if ((N & 0xFFFFFFFF) !== N) return {S: FAIL, N};

    // TODO: check sign...
    let isNegative = false;
    if (N < 0) {
        isNegative = true;
        if (N === -2147483648) return {S: '-2147483648', N: NO_NODE}; // the one case where N = -N could overflow
        N = -N as number;
    }

    // TODO: ...then digits
    let digits = [] as string[];
    while (true) {
        let d = N % 10;
        N = ((N / 10) | 0) as number;
        digits.push(String.fromCharCode(UNICODE_ZERO_DIGIT + d));
        if (N === 0) break;
    }

    // TODO: compute final string...
    if (isNegative) digits.push('-');
    return {S: digits.reverse().join(''), N: NO_NODE};
}

// These constants are used by the i32 unparser.
const UNICODE_ZERO_DIGIT = '0'.charCodeAt(0);




export function char(N: unknown): Duad {
    if (typeof N !== 'string' || N.length === 0) return {S: FAIL, N};
    return {S: N.charAt(0), N: N.slice(1)};
}




// TODO: where do these ones belong?
export function intrinsic_true(N: unknown): Duad {
    return N === true ? {S: '', N: NO_NODE} : {S: FAIL, N};
}
export function intrinsic_false(N: unknown): Duad {
    return N === false ? {S: '', N: NO_NODE} : {S: FAIL, N};
}
export function intrinsic_null(N: unknown): Duad {
    return N === null ? {S: '', N: NO_NODE} : {S: FAIL, N};
}
export function ZeroOrMore(expression: Transcoder): Transcoder {
    return N => {
        // TODO: temp testing... this requires incrementally consuming from N, which we only know how to do
        // if N is a string. Since iteration doesn't make sense (for now?) with objects or lists, but ZeroOrMore
        // should *always* succeed, in non-string cases we just consume nothing and return success.
        // Investigate if the above summary is complete and correct in all cases. Any counterexamples that should
        // be handled differently? Eg iterating *one time* to consume an object or list as a whole? Or would we
        // make that a type error when we add type-checking?
        if (typeof N !== 'string') return {S: '', N};

        let S: Span = '';
        while (true) {
            let result = expression(N);
            if (result.S === FAIL) return {S, N};

            // TODO: check if any input was consumed... if not, return with zero iterations, since otherwise
            // we would loop forever. Change to one iteration as 'canonical' / more useful behaviour? Why (not)?
            if (N === result.N) return {S, N};

            assert(isResidualNode(N, result.N)); // TODO: this expensive check should be enabled only in debug mode.
                                                    //       Also it should be wrapped around *all* unparse calls since
                                                    //       it is an invariant of unparsing.
            S += result.S;
            N = result.N;
        }
    };
}
export function Maybe(expression: Transcoder): Transcoder {
    return N => {
        let result = expression(N);
        return result.S === FAIL ? {S: '', N} : result;
    };
}
export function Not(expression: Transcoder): Transcoder {
    return N => {
        let result = expression(N);
        return result.S === FAIL ? {S: '', N} : {S: FAIL, N};
    };
}




// TODO: internal helpers...
function isFullyConsumed(N: unknown) {
    if (N === NO_NODE) return true;
    if (N === '') return true;
    if (isPlainObject(N) && Object.keys(N).length === 0) return true;
    if (Array.isArray(N) && N.length === 0) return true;
    return false;
}

function isResidualNode(N: unknown, Nʹ: unknown) {
    if (typeof N === 'string') {
        return typeof Nʹ === 'string' && N.endsWith(Nʹ);
    }
    if (isPlainObject(N)) {
        return isPlainObject(Nʹ) && Object.keys(Nʹ).every(k => N.hasOwnProperty(k) && (N as any)[k] === (Nʹ as any)[k]);
    }
    if (Array.isArray(N)) {
        if (!Array.isArray(Nʹ)) return false;
        for (let n = Nʹ.length, i = N.length - n, j = 0; j < n; ++i, ++j) {
            if (N[i] !== Nʹ[j]) return false;
        }
        return true;
    }
    return Nʹ === N || Nʹ === NO_NODE;
}

function isPlainObject(value: unknown): value is object {
    return value !== null && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype;
}

function assert(value: unknown) {
    if (!value) throw new Error(`Assertion failed`);
}
