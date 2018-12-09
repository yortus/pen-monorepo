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
    function LeftRec(expr: Transcoder): Transcoder {
        interface Memo {
            resolved: boolean;
            result: Duad | null;
        }
        const memos = new Map<string, Memo>(); // TODO: WeakMap better?

        return state => {
            let memo = memos.get(state.S); // TODO: what about state.N, should that form part of memo's key? Investigate...
            if (!memo) {
                // TODO: ...
                // Memo has just been created...
                // transduce and memoize the inner expession using a cycle-tolerant algorithm...
                memo = {resolved: false, result: null};
                memos.set(state.S, memo);

                // TODO: ...
                let stateᐟ = expr(state); // recurse... the memo will be updated...

                // We now have a fully resolved memo.
                memo.resolved = true;
                memo.result = stateᐟ;

                // TODO: If the preceding call to Transduce() succeeded...
                // Re-transduce from our initial position until we meet a stopping condition.
                // This will transduce left-cycles without getting caught in an infinite loop. It works as follows.
                // When the call to Transduce() below reaches a left-cyclic path, this method is reentered with
                // the same source position. But thanks to the preceding code, there is a resolved memo for this
                // position now. The method uses this memo and returns immediately, and transduction continues
                // beyond the left-cycle. We stop the re-transduction loop when it either fails or consumes no
                // further input (which could be due to right-cycles).
                while (stateᐟ !== null) {
// TODO: REVIEW FROM HERE... ===>
                    stateᐟ = expr(state);

                    // If the re-transduction positively progressed, update the memo and re-transduce again
                    if (stateᐟ === null) return memo.result;
                    if (stateᐟ.S.length >= memo.result.S.length) return memo.result;
                    memo.result = stateᐟ;
// ...TO HERE ===>
        }
            }

            else if (!memo.resolved) {
                // TODO: ...
                // We have re-entered this function at the same input position as the original call,
                // so we must have encountered a left-cycle. We simply flag the presence of the left-cycle
                // and return false, as explained in the previous switch case.
                return null;
            }

            // TODO: ...
            // If we get here, Memo is established - use it for the translation
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

    function Record(fields: Array<{id: string, value: Transcoder}>): Transcoder {
        const arity = fields.length;
        return state => {
            assert(state.N === EMPTY_NODE); // a record can't augment another node
            let S = state.S;
            let N = {};
            for (let i = 0; i < arity; ++i) {
                let {id, value} = fields[i];
                let result = value({S, N: EMPTY_NODE});
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
