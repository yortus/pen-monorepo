type Span = string;
const EMPTY_NODE = Symbol('EmptyNode');
type EmptyNode = typeof EMPTY_NODE;
type Node = EmptyNode | string | number | object;
interface Duad { S: Span; N: Node; }
type Transcoder = (t: Duad) => Duad | null;
declare const start: Transcoder;




export function parse(text: string) {

    // TODO: misc precomputed values...
    const UNICODE_ZERO_DIGIT = '0'.charCodeAt(0);
    const ONE_TENTH_MAXINT32 = 0x7FFFFFFF / 10;

    // NB: For simplicity of implementation, when we consume characters from `text`, we replace `text` with
    // its unconsumed suffix, reapeating until it is fully consumed. This is simpler than tracking both the text and
    // an offset. It is also reasonably performant, since most JS runtimes (including V8) optimise string slicing
    // like the kind done here. E.g. see https://jsperf.com/consuming-a-long-string
    // This could be revisited later to increase performance, but it should be measured to see if it's worth it.
    // these two fns just make reading the code a bit easier. Will be more important when there is more state beside pos
    // function consume(count: number) { text = text.slice(count); }
    // function restore(_text: string) { text = _text; }




    placeholder: {}




    debugger;
    let ast = start({S: text, N: EMPTY_NODE});
    if (ast === null) throw new Error(`parse failed`);
    if (ast.S.length > 0) throw new Error(`parse didn't consume entire input`);
    if (ast.N === EMPTY_NODE) throw new Error(`parse didn't return a value`);
    return ast.N;




    // ---------- wip... ----------
    function Memo(expr: Transcoder): Transcoder {
        // TODO: WeakMap better? but can't key WeakMap by string, see:
        // https://softwareengineering.stackexchange.com/questions/324345/why-cant-an-es2015-weakmap-have-primitive-keys
        const memos = new Map<string, {
            resolved: boolean;
            isLeftRecursive: boolean;
            result: Duad | null;
        }>();

        return state => {
            // Check whether the memo table already has an entry for the given value of state.S.
            let memo = memos.get(state.S);
            if (!memo) {
                // The memo table does *not* have an entry, so this is the first attempt to parse this rule at state.S.
                // The first thing we do is create a memo table entry, which is marked as *unresolved*. All future calls
                // with the same value of state.S will find this memo. If a future call finds the memo still unresolved,
                // then we know we have encountered left-recursion.
                memo = {resolved: false, isLeftRecursive: false, result: null};
                memos.set(state.S, memo);

                // Now that the unresolved memo is in place, invoke the rule, and resolve the memo with the result. At
                // this point, any left-recursive invocations are guaranteed to have been noted and aborted (see below).
                memo.result = expr(state);
                memo.resolved = true;

                // If we did *not* encounter left-recursion, then we have simple memoisation, and the result is final.
                if (!memo.isLeftRecursive) return memo.result;

                // If we get here, then the above invocation of the rule called itself left-recursively, but we aborted
                // the left-recursive path(s). That means that the current parse result is either a failed parse, or a
                // successful parse of a non-left-recursive application of the rule. We now iterate, repeatedly parsing
                // the same rule with the same input. We continue to iterate as long as the parse succeeds and
                // consumes more input, in which case we update the memo with the new result. We thus 'grow' the parse
                // result until it no longer succeeds or consumes more input, at which point we take the memo as final.
                while (memo.result !== null) {
                    let stateᐟ = expr(state);
                    if (stateᐟ === null || stateᐟ.S.length >= memo.result.S.length) break;
                    memo.result = stateᐟ;
                }
            }
            else if (!memo.resolved) {
                // If we get here, then we have already invoked the rule at this input position, but not resolved it.
                // That means we must have entered a left-recursive path of the rule. All we do here is note that the
                // rule application encountered left-recursion, and return a failed parse. This means that the initial
                // application of the rule at this position can only possibly succeed along a non-left-recursive path.
                // More importantly, it means the parser will never loop endlessly on left-recursive rules.
                memo.isLeftRecursive = true;
                return null;
            }

            // We have a resolved memo, so the result of the parse is already computed. Return it from the memo.
            return memo.result;
        };
    }




    // ---------- built-in parser combinators ----------
    function Selection(...expressions: Transcoder[]): Transcoder {
        const arity = expressions.length;
        return state => {
            let stateᐟ = null;
            for (let i = 0; i < arity && stateᐟ === null; ++i) {
                stateᐟ = expressions[i](state);
            }
            return stateᐟ;
        };
    }

    function Sequence(...expressions: Transcoder[]): Transcoder {
        const arity = expressions.length;
        return state => {
            let stateᐟ = state;
            for (let i = 0; i < arity && stateᐟ !== null; ++i) {
                stateᐟ = expressions[i](stateᐟ);
            }
            return stateᐟ;
        };
    }

    function Record(fields: Array<{id: string, expression: Transcoder}>): Transcoder {
        const arity = fields.length;
        return state => {
            assert(state.N === EMPTY_NODE); // a record can't augment another node
            let S = state.S;
            let N = {};
            for (let i = 0; i < arity; ++i) {
                let {id, expression} = fields[i];
                let result = expression({S, N: EMPTY_NODE});
                if (result === null) return null;
                S = result.S;
                N[id] = result.N;
            }
            return {S, N};
        };
    }




    // ---------- built-in parser factories ----------
    function AbstractStringLiteral(value: string): Transcoder {
        return ({S, N}) => {
            assert(N === EMPTY_NODE || typeof N === 'string'); // a string can augment another string
            return {S, N: N === EMPTY_NODE ? value : (N + value)};
        };
    }

    function ConcreteStringLiteral(value: string): Transcoder {
        return ({S, N}) => {
            if (!S.startsWith(value)) return null;
            return {S: S.slice(value.length), N};
        };
    }

    function UniformStringLiteral(value: string): Transcoder {
        return ({S, N}) => {
            assert(N === EMPTY_NODE || typeof N === 'string'); // a string can augment another string
            if (!S.startsWith(value)) return null;
            return {S: S.slice(value.length), N: N === EMPTY_NODE ? value : (N + value)};
        };
    }




    // ---------- other built-ins ----------
    function i32({S, N}: Duad): Duad {
        if (N !== EMPTY_NODE) return null; // an i32 can't augment another node

        // Parse optional leading '-' sign...
        let isNegative = false;
        if (S.charAt(0) === '-') {
            isNegative = true;
            S = S.slice(1);
        }

        // ...followed by one or more decimal digits. (NB: no exponents).
        N = 0;
        let digits = 0;
        while (S.length > 0) {

            // Read a digit
            let c = S.charCodeAt(0);
            if (c < UNICODE_ZERO_DIGIT || c > UNICODE_ZERO_DIGIT + 9) break;

            // Check for overflow
            if (N > ONE_TENTH_MAXINT32) {
                return null;
            }

            // Update parsed number
            N *= 10;
            N += (c - UNICODE_ZERO_DIGIT);
            S = S.slice(1);
            ++digits;
        }

        // Check that we parsed at least one digit.
        if (digits === 0) return null;

        // Apply the sign.
        if (isNegative) N = -N;

        // Check for over/under-flow. This *is* needed to catch -2147483649, 2147483648 and 2147483649.
        // tslint:disable-next-line:no-bitwise
        if (isNegative ? (N & 0xFFFFFFFF) >= 0 : (N & 0xFFFFFFFF) < 0) return null;

        // Success
        return {S, N};
    }
}




function assert(value: unknown) {
    if (!value) throw new Error(`Assertion failed`);
}
