type Span = number; // index of start position in `text`
const NO_NODE = Symbol('NoNode');
type NO_NODE = typeof NO_NODE;
type Node = NO_NODE | string | number | boolean | null | object | any[];
interface Duad { S: Span; N: Node; }
type Transcoder = (S: Span) => Duad | null;
declare const start: Transcoder;




export function parse(text: string): Node {

    // These constants are used by the i32 parser below.
    const UNICODE_ZERO_DIGIT = '0'.charCodeAt(0);
    const ONE_TENTH_MAXINT32 = 0x7FFFFFFF / 10;




    return (function userScope() {
        // @ts-ignore 7028 unused label
        placeholder: {}

        //debugger;
        let ast = start(0);
        if (ast === null) throw new Error(`parse failed`);
        if (ast.S !== text.length) throw new Error(`parse didn't consume entire input`);
        if (ast.N === NO_NODE) throw new Error(`parse didn't return a value`);
        return ast.N;
    })();




    // ---------- wip... ----------
    // @ts-ignore 6133 unused declaration
    function Memo(expr: Transcoder): Transcoder {
        const memos = new Map<Span, {resolved: boolean, isLeftRecursive: boolean, result: Duad | null}>();
        return S => {
            // Check whether the memo table already has an entry for the given initial state.
            let memo = memos.get(S);
            if (!memo) {
                // The memo table does *not* have an entry, so this is the first attempt to apply this rule with this
                // initial state. The first thing we do is create a memo table entry, which is marked as *unresolved*.
                // All future applications of this rule with the same initial state will find this memo. If a future
                // application finds the memo still unresolved, then we know we have encountered left-recursion.
                memo = {resolved: false, isLeftRecursive: false, result: null};
                memos.set(S, memo);

                // Now that the unresolved memo is in place, apply the rule, and resolve the memo with the result. At
                // this point, any left-recursive paths encountered during application are guaranteed to have been noted
                // and aborted (see below).
                memo.result = expr(S);
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
                    let nextResult = expr(S);
                    if (nextResult === null || nextResult.S <= memo.result.S) break;
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
        return S => {
            for (let i = 0; i < arity; ++i) {
                let result = expressions[i](S);
                if (result !== null) return result;
            }
            return null;
        };
    }

    // @ts-ignore 6133 unused declaration
    function Sequence(...expressions: Transcoder[]): Transcoder {
        const arity = expressions.length;
        return S => {
            let N: Node = NO_NODE;
            for (let i = 0; i < arity; ++i) {
                let result = expressions[i](S);
                if (result === null) return null;
                S = result.S;
                if (N === NO_NODE) N = result.N;
                else if (typeof N === 'string' && typeof result.N === 'string') N = N + result.N;
                else if (result.N !== NO_NODE) throw new Error(`Internal error: invalid sequence`);
            }
            return {S, N};
        };
    }

    type RecordField =
        | {type: 'static', name: string, value: Transcoder}
        | {type: 'computed', name: Transcoder, value: Transcoder}
        | {type: 'spread', expr: Transcoder};
    // @ts-ignore 6133 unused declaration
    function Record(fields: RecordField[]): Transcoder {
        return S => {
            let N = {} as any; // TODO: remove/improve cast
            for (let field of fields) {
                let result: Duad | null;

                if (field.type === 'spread') {
                    result = field.expr(S);
                    if (result === null) return null;
                    assert(result.N === NO_NODE || (result.N && typeof result.N === 'object'));
                    if (result.N !== NO_NODE) Object.assign(N, result.N);
                    S = result.S;
                }
                else {
                    let id: string;
                    if (field.type === 'computed') {
                        result = field.name(S);
                        if (result === null) return null;
                        assert(typeof result.N === 'string');
                        id = result.N as string;
                        S = result.S;
                    }
                    else /* field.type === 'static' */ {
                        id = field.name;
                    }

                    result = field.value(S);
                    if (result === null) return null;
                    assert(result.N !== NO_NODE);
                    N[id] = result.N;
                    S = result.S;
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
        return S => {
            let N = [] as Node[];
            for (let element of elements) {
                if (element.type === 'spread') {
                    let result = element.expr(S);
                    if (result === null) return null;
                    assert(result.N === NO_NODE || Array.isArray(result.N));
                    if (result.N !== NO_NODE) N.push(...result.N as any[]);
                    S = result.S;
                }
                else /* field.type === 'element' */ {
                    let result = element.value(S);
                    if (result === null) return null;
                    assert(result.N !== NO_NODE);
                    N.push(result.N);
                    S = result.S;
                }
            }
            return {S, N};
        };
    }




    // ---------- built-in parser factories ----------
    // @ts-ignore 6133 unused declaration
    function AbstractStringLiteral(value: string): Transcoder {
        return S => {
            return {S, N: value};
        };
    }

    // @ts-ignore 6133 unused declaration
    function ConcreteStringLiteral(value: string): Transcoder {
        return S => {
            if (!matchesAt(text, value, S)) return null;
            return {S: S + value.length, N: NO_NODE};
        };
    }

    // @ts-ignore 6133 unused declaration
    function UniformStringLiteral(value: string): Transcoder {
        return S => {
            if (!matchesAt(text, value, S)) return null;
            return {S: S + value.length, N: value};
        };
    }




    // ---------- other built-ins ----------
    // @ts-ignore 6133 unused declaration
    function i32(S: Span): Duad | null {

        // Parse optional leading '-' sign...
        let isNegative = false;
        if (text.charAt(S) === '-') {
            isNegative = true;
            S += 1;
        }

        // ...followed by one or more decimal digits. (NB: no exponents).
        let N = 0;
        let digits = 0;
        while (S < text.length) {

            // Read a digit
            let c = text.charCodeAt(S);
            if (c < UNICODE_ZERO_DIGIT || c > UNICODE_ZERO_DIGIT + 9) break;

            // Check for overflow
            if (N > ONE_TENTH_MAXINT32) {
                return null;
            }

            // Update parsed number
            N *= 10;
            N += (c - UNICODE_ZERO_DIGIT);
            S += 1;
            ++digits;
        }

        // Check that we parsed at least one digit.
        if (digits === 0) return null;

        // Apply the sign.
        if (isNegative) N = -N;

        // Check for over/under-flow. This *is* needed to catch -2147483649, 2147483648 and 2147483649.
        if (isNegative ? (N & 0xFFFFFFFF) >= 0 : (N & 0xFFFFFFFF) < 0) return null;

        // Success
        return {S, N};
    }




    // TODO: where do these ones belong?
    // @ts-ignore 6133 unused declaration
    function intrinsic_true(S: Span): Duad | null {
        return {S, N: true};
    }
    // @ts-ignore 6133 unused declaration
    function intrinsic_false(S: Span): Duad | null {
        return {S, N: false};
    }
    // @ts-ignore 6133 unused declaration
    function intrinsic_null(S: Span): Duad | null {
        return {S, N: null};
    }
    // @ts-ignore 6133 unused declaration
    function ZeroOrMore(expression: Transcoder): Transcoder {
        return S => {
            let N: Node = NO_NODE;
            while (true) {
                let result = expression(S);
                if (result === null) return {S, N};
                assert(S !== result.S); // TODO: ensure something was consumed... is this always correct?
                assert(result.N === NO_NODE); // TODO: allow string concatenation on the abstract side
                S = result.S;
            }
        };
    }
    // @ts-ignore 6133 unused declaration
    function Maybe(expression: Transcoder): Transcoder {
        return S => expression(S) || {S, N: NO_NODE};
    }
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
