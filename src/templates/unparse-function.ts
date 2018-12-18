type Span = string;
const NO_NODE = Symbol('NoNode');
type NO_NODE = typeof NO_NODE;
type Node = NO_NODE | string | number | boolean | null | object | any[];
interface Duad { S: Span; N: Node; }
type Transcoder = (N: Node) => Duad | null;
declare const start: Transcoder;




export function unparse(ast: Node): string {

    // These constants are used by the i32 unparser below.
    const UNICODE_ZERO_DIGIT = '0'.charCodeAt(0);




    return (function userScope() {
        // @ts-ignore 7028 unused label
        placeholder: {}

        //debugger;
        let text = start(ast);
        if (text === null) throw new Error(`unparse failed`);
        if (!isFullyConsumed(text.N)) throw new Error(`unparse didn't consume entire input`);
        return text.S;
    })();




    // ---------- wip... ----------
    // @ts-ignore 6133 unused declaration
    function Memo(expr: Transcoder): Transcoder {
        const memos = new Map<Node, {resolved: boolean, isLeftRecursive: boolean, result: Duad | null}>();
        return N => {
            // Check whether the memo table already has an entry for the given initial state.
            let memo = memos.get(N);
            if (!memo) {
                // The memo table does *not* have an entry, so this is the first attempt to apply this rule with this
                // initial state. The first thing we do is create a memo table entry, which is marked as *unresolved*.
                // All future applications of this rule with the same initial state will find this memo. If a future
                // application finds the memo still unresolved, then we know we have encountered left-recursion.
                memo = {resolved: false, isLeftRecursive: false, result: null};
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
                while (memo.result !== null) {
                    let nextResult = expr(N);

                    // TODO: break cases:
                    // anything --> same thing (covers all string cases, since they can only be same or shorter)
                    // NO_NODE --> anything
                    // some node --> some different non-empty node (assert: should never happen!)
                    if (nextResult === null) break;
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
                return null;
            }

            // We have a resolved memo, so the result of the rule application for the given initial state has already
            // been computed. Return it from the memo.
            return memo.result;
        };
    }




    // ---------- built-in parser combinators ----------
    // @ts-ignore 6133 unused declaration
    function Selection(...expressions: Transcoder[]): Transcoder {
        const arity = expressions.length;
        return N => {
            for (let i = 0; i < arity; ++i) {
                let result = expressions[i](N);
                if (result !== null) return result;
            }
            return null;
        };
    }

    // @ts-ignore 6133 unused declaration
    function Sequence(...expressions: Transcoder[]): Transcoder {
        const arity = expressions.length;
        return N => {
            let S: Span = '';
            for (let i = 0; i < arity; ++i) {
                let result = expressions[i](N);
                if (result === null) return null;
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
    // @ts-ignore 6133 unused declaration
    function Record(fields: Field[]): Transcoder {
        return N => {
            let S = '';
            if (!isPlainObject(N)) return null;

            // Make a copy of N from which we delete key/value pairs once they are consumed
            N = {...N};

            // TODO: ...
            outerLoop:
            for (let field of fields) {
                if (field.type === 'spread') {
                    // TODO: ...
                    let result = field.expr(N);
                    if (result === null) return null;
                    assert(isResidualNode(N, result.N)); // TODO: see comment in Sequence() re isResidualNode
                    S += result.S;
                    N = {...result.N as object};
                }
                else {

                    // Find the first property key/value pair that matches this field name/value pair (if any)
                    let propNames = Object.keys(N);
                    for (let propName of propNames) {
                        if (field.type === 'computed') {
                            let r = field.name(propName);
                            if (r === null || r.N !== '') continue;
                            S += r.S;
                        }
                        else /* field.type === 'static' */ {
                            if (propName !== field.name) continue;
                        }

                        // TODO: match value
                        let result = field.value((N as any)[propName]);
                        if (result === null) continue;
                        if (!isFullyConsumed(result.N)) continue;
                        S += result.S;

                        // TODO: we matched both name and value - consume them from N
                        delete (N as any)[propName];
                        continue outerLoop;
                    }

                    // If we get here, no match...
                    return null;
                }
            }
            return {S, N};
        };
    }

    type ListElement =
        | {type: 'element', value: Transcoder}
        | {type: 'spread', expr: Transcoder};
    // @ts-ignore 6133 unused declaration
    function List(elements: ListElement[]): Transcoder {
        return N => {
            let S = '';
            if (!Array.isArray(N)) return null;

            // TODO: was... for records... can just slice arrays
            // // Make a copy of N from which we slice off elements once they are consumed
            // N = {...N};

            // TODO: ... fix casts in code below
            for (let element of elements) {
                if (element.type === 'spread') {
                    let result = element.expr(N);
                    if (result === null) return null;
                    assert(isResidualNode(N, result.N)); // TODO: see comment in Sequence() re isResidualNode
                    S += result.S;
                    N = result.N as any[];
                }
                else /* element.type === 'element' */{
                    if ((N as any[]).length === 0) return null;
                    let result = element.value((N as any[])[0]);
                    if (result === null) return null;
                    if (!isFullyConsumed(result.N)) return null;
                    S += result.S;
                    N = (N as any[]).slice(1);
                }
            }
            return {S, N};
        };
    }




    // ---------- built-in parser factories ----------
    // @ts-ignore 6133 unused declaration
    function AbstractStringLiteral(value: string): Transcoder {
        return N => {
            if (typeof N !== 'string' || !N.startsWith(value)) return null;
            return {S: '', N: N.slice(value.length)};
        };
    }

    // @ts-ignore 6133 unused declaration
    function ConcreteStringLiteral(value: string): Transcoder {
        return N => {
            return {S: value, N};
        };
    }

    // @ts-ignore 6133 unused declaration
    function UniformStringLiteral(value: string): Transcoder {
        return N => {
            if (typeof N !== 'string' || !N.startsWith(value)) return null;
            return {S: value, N: N.slice(value.length)};
        };
    }




    // ---------- other built-ins ----------
    // @ts-ignore 6133 unused declaration
    function i32(N: Node): Duad | null {

        // TODO: ensure N is a 32-bit integer
        if (typeof N !== 'number') return null;
        if ((N & 0xFFFFFFFF) !== N) return null;

        // TODO: check sign...
        let isNegative = false;
        if (N < 0) {
            isNegative = true;
            if (N === -2147483648) return {S: '-2147483648', N: NO_NODE}; // the one case where N = -N could overflow
            N = -N;
        }

        // TODO: ...then digits
        let digits = [] as string[];
        while (true) {
            let d = N % 10;
            N = (N / 10) | 0;
            digits.push(String.fromCharCode(UNICODE_ZERO_DIGIT + d));
            if (N === 0) break;
        }

        // TODO: compute final string...
        if (isNegative) digits.push('-');
        return {S: digits.reverse().join(''), N: NO_NODE};
    }




    // TODO: where do these ones belong?
    // @ts-ignore 6133 unused declaration
    function intrinsic_true(N: Node): Duad | null {
        return N === true ? {S: '', N: NO_NODE} : null;
    }
    // @ts-ignore 6133 unused declaration
    function intrinsic_false(N: Node): Duad | null {
        return N === false ? {S: '', N: NO_NODE} : null;
    }
    // @ts-ignore 6133 unused declaration
    function intrinsic_null(N: Node): Duad | null {
        return N === null ? {S: '', N: NO_NODE} : null;
    }
    // @ts-ignore 6133 unused declaration
    function ZeroOrMore(expression: Transcoder): Transcoder {
        return N => {
            // TODO: temp testing... always go with zero iterations for now, since on the parse side we never produce
            // a node. Otherwise this would loop forever without consuming anything from N.
            return {S: '', N};
            // TODO: was... loops forever...
            // let S: Span = '';
            // while (true) {
            //     let result = expression(N);
            //     if (result === null) return {S, N};
            //     assert(result.S !== ''); // TODO: ensure something was produced... is this always correct?
            //     assert(result.N === N); // TODO: allow string concatenation on the abstract side
            //     S += result.S;
            // }
        };
    }
    // @ts-ignore 6133 unused declaration
    function Maybe(expression: Transcoder): Transcoder {
        return N => expression(N) || {S: '', N};
    }
}




function isFullyConsumed(N: Node) {
    if (N === NO_NODE) return true;
    if (N === '') return true;
    if (isPlainObject(N) && Object.keys(N).length === 0) return true;
    if (Array.isArray(N) && N.length === 0) return true;
    return false;
}

function isResidualNode(N: Node, Nʹ: Node) {
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
