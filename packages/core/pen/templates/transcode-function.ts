type Span = string;
const EMPTY_NODE = Symbol('EmptyNode');
type EmptyNode = typeof EMPTY_NODE;
type Node = EmptyNode | string | number | object;
interface Duad { S: Span; N: Node; }
type Transcoder = (t: Duad) => Duad | null;
declare const start: Transcoder;




export function parse(text: string) {

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
        const memos = new Map<string, Memo>();

        return state => {
            let memo = memos.get(state.S); // TODO: what about state.N, should that form part of memo's key? Investigate...
            if (!memo) {
                // TODO: ...
                // Memo has just been created...
                // transduce and memoize the inner expession using a cycle-tolerant algorithm...
                memo = {resolved: false, result: null};
                memos.set(state.S, memo);

                // TODO: ...
                let S0 = state.S;
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
    // function Selection(...expressions: Transcoder[]): Transcoder {
    //     return state => {
    //         let stateᐟ = null;
    //         for (let i = 0; i < expressions.length && stateᐟ === null; ++i) {
    //             stateᐟ = expressions[i](state);
    //         }
    //         return stateᐟ;
    //     };
    // }

    // function Sequence(...expressions: Transcoder[]): Transcoder {
    //     return state => {
    //         if (state === null) return null; // TODO: really want this atop every transcoder? why? why not?
    //         assert(state.N === EMPTY_NODE); // TODO: check... can sequences augment any existing node? eg when nested?
    //         let stateᐟ = state;
    //         for (let i = 0; i < expressions.length && stateᐟ !== null; ++i) {
    //             stateᐟ = expressions[i](stateᐟ);
    //         }
    //         return stateᐟ;
    //     };
    // }

    function Record(fields: {[id: string]: Transcoder}): Transcoder {
        // TODO: doc... relies on prop order being preserved...
        const fieldIds = Object.keys(fields);
        return state => {
            if (state === null) return null; // TODO: really want this atop every transcoder? why? why not?
            assert(state.N === EMPTY_NODE); // TODO: explain... records can't augment any existing node
            let S = state.S;
            let N = {};
            for (let id of fieldIds) {
                let result = fields[id]({S, N: EMPTY_NODE});
                if (result === null) return null;
                S = result.S;
                N[id] = result.N;
            }
            return {S, N};
        };
    }




    // ---------- built-in parser factories ----------
    function Identifier(name: string): Transcoder {
        // TODO: ...
        return state => null;
    }

    function AbstractStringLiteral(value: string): Transcoder {
        return state => {
            if (state === null) return null; // TODO: really want this atop every transcoder? why? why not?
            assert(state.N === EMPTY_NODE); // TODO: remove this limitation, augmentation should work
            return {S: state.S, N: value};
        };
    }

    function ConcreteStringLiteral(value: string): Transcoder {
        return state => {
            if (state === null) return null; // TODO: really want this atop every transcoder? why? why not?
            if (!state.S.startsWith(value)) return null;
            return {S: state.S.slice(value.length), N: state.N};
        };
    }

    function UniformStringLiteral(value: string): Transcoder {
        return state => {
            if (state === null) return null; // TODO: really want this atop every transcoder? why? why not?
            assert(state.N === EMPTY_NODE); // TODO: remove this limitation, augmentation should work
            if (!state.S.startsWith(value)) return null;
            return {S: state.S.slice(value.length), N: value};
        };
    }




    // ---------- other built-ins ----------
    function i32(state: Duad): Duad {
        if (state === null) return null; // TODO: really want this atop every transcoder? why? why not?
        assert(state.N === EMPTY_NODE); // TODO: explain... i32 can't augment any existing node

        // TODO: negative ints
        // TODO: exponents

        // TODO: would be better not to calc these on every call
        const ZERO = '0'.charCodeAt(0);
        const NINE = '9'.charCodeAt(0);
        const ONE_TENTH_MAXINT32 = 0x7FFFFFFF / 10;

        let S = state.S;
        let N = 0;
        while (S.length > 0) {

            // Read a digit
            let c = S.charCodeAt(0);
            if (c < ZERO || c > NINE) break;

            // Check for overflow
            if (N > ONE_TENTH_MAXINT32) {
                return null;
            }

            // Update parsed number
            N *= 10;
            N += (c - ZERO);
            S = S.slice(1);
        }

        // Check that we parsed at least one digit
        if (S === state.S) return null;

        // TODO: sanity check over/under-flow. See eg:
        // https://github.com/dotnet/coreclr/blob/cdff8b0babe5d82737058ccdae8b14d8ae90160d/src/mscorlib/src/System/Number.cs#L518-L532

        // Success
        return {S, N};
    }
}




function assert(value: unknown) {
    if (!value) throw new Error(`Assertion failed`);
}
