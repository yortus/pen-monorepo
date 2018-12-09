type Span = string; // index of start position in `text`
const EMPTY_NODE = Symbol('EmptyNode');
type EmptyNode = typeof EMPTY_NODE;
type Node = EmptyNode | string | number | object;
interface Duad { S: Span; N: Node; }
type Transcoder = (t: Duad) => Duad | null;
declare const start: Transcoder;




export function unparse(ast: Node): string {

    // These constants are used by the i32 unparser below.
    const UNICODE_ZERO_DIGIT = '0'.charCodeAt(0);




    placeholder: {}




    debugger;
    let text = start({N: ast, S: ''});
    if (text === null) throw new Error(`unparse failed`);
    if (text.N !== EMPTY_NODE) throw new Error(`unparse didn't consume entire input`);
    return text.S;




    // ---------- wip... ----------
    function Memo(expr: Transcoder): Transcoder {
        // TODO: code is *almost* identical for parse and unparse... make DRY
        const memos = new Map<Node, { // TODO: use holey array? Faster? to much RAM load? V8 array tips?
            resolved: boolean;
            isLeftRecursive: boolean;
            result: Duad | null;
        }>();
        return state => {
            // Check whether the memo table already has an entry for the given value of state.N.
            let memo = memos.get(state.N);
            if (!memo) {
                // The memo table does *not* have an entry, so this is the first attempt to parse this rule at state.N.
                // The first thing we do is create a memo table entry, which is marked as *unresolved*. All future calls
                // with the same value of state.S will find this memo. If a future call finds the memo still unresolved,
                // then we know we have encountered left-recursion.
                memo = {resolved: false, isLeftRecursive: false, result: null};
                memos.set(state.N, memo);

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
                    if (stateᐟ === null) break;

                    // TODO: break cases:
                    // anything --> same thing (covers all string cases, since they can only be same, shorter or EMPTY)
                    // EMPTY_NODE --> anything
                    // some node --> some different non-empty node (assert: should never happen!)
                    if (stateᐟ.N === memo.result.N) break;
                    if (memo.result.N === EMPTY_NODE) break;
                    if (stateᐟ.N !== EMPTY_NODE) break;
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
        // TODO: code is identical for parse and unparse... make DRY
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
        // TODO: code is identical for parse and unparse... make DRY
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
        return ({N, S}) => {
            if (!isPlainObject(N)) return null;
            if (Object.keys(N).length !== arity) return null;
            for (let i = 0; i < arity; ++i) {
                let {id, expression} = fields[i];
                if (!N.hasOwnProperty(id)) return null;
                let result = expression({N: N[id], S});
                if (result === null) return null;
                S = result.S;
            }
            return {N, S};
        };
    }




    // ---------- built-in parser factories ----------
    function AbstractStringLiteral(value: string): Transcoder {
        return ({N, S}) => {
            if (value === '') return {N, S};
            if (typeof N !== 'string') return null;
            if (!N.startsWith(value)) return null;
            return {N: N.slice(value.length) || EMPTY_NODE, S};
        };
    }

    function ConcreteStringLiteral(value: string): Transcoder {
        return ({N, S}) => {
            return {N, S: S + value};
        };
    }

    function UniformStringLiteral(value: string): Transcoder {
        return ({N, S}) => {
            if (value === '') return {N, S};
            if (typeof N !== 'string') return null;
            if (!N.startsWith(value)) return null;
            return {N: N.slice(value.length) || EMPTY_NODE, S: S + value};
        };
    }




    // ---------- other built-ins ----------
    function i32({N, S}: Duad): Duad {

        // TODO: ensure N is a 32-bit integer
        if (typeof N !== 'number') return null;
        if ((N & 0xFFFFFFFF) !== N) return null;

        // TODO: check sign...
        let isNegative = false;
        if (N < 0) {
            isNegative = true;
            if (N === -2147483648) return {N: EMPTY_NODE, S: '-2147483648'}; // one case where N = -N could overflow
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
        return {N: EMPTY_NODE, S: S + digits.reverse().join('')};
    }
}




function isPlainObject(value: unknown): value is object {
    return value !== null && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype;
}
