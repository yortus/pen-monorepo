type Parser = (pos: number) => boolean;
declare const start: Parser;




export function parse(text: string) {
    let len = 0;        // these two are additional parser return values
    let ast: unknown;   // "   "
    const NOTHING = Symbol('nothing');




    placeholder: {}




    debugger;
    if (!start(0)) throw new Error(`parse failed`);
    if (len < text.length) throw new Error(`parse didn't consume entire input`);
    return ast;




    // ---------- wip... ----------
    function LeftRec(expr: Parser): Parser {
        interface Memo {
            resolved: boolean;
            success: boolean;
            len: number;
            ast: unknown;
        }
        const memos = new Map<number, Memo>();

        return pos => {
            let memo = memos.get(pos);
            if (!memo) {
                // TODO: ...
                // Memo has just been created...
                // transduce and memoize the inner expession using a cycle-tolerant algorithm...
                memo = {resolved: false, success: false, len: 0, ast: undefined};
                memos.set(pos, memo);

                // TODO: ...
                let result = expr(pos); // recurse... the memo will be updated...

                // We now have a fully resolved memo.
                memo.resolved = true;
                memo.success = result;
                memo.len = len;
                memo.ast = ast;

                // TODO: If the preceding call to Transduce() succeeded...
                // Re-transduce from our initial position until we meet a stopping condition.
                // This will transduce left-cycles without getting caught in an infinite loop. It works as follows.
                // When the call to Transduce() below reaches a left-cyclic path, this method is reentered with
                // the same source position. But thanks to the preceding code, there is a resolved memo for this
                // position now. The method uses this memo and returns immediately, and transduction continues
                // beyond the left-cycle. We stop the re-transduction loop when it either fails or consumes no
                // further input (which could be due to right-cycles).
                while (result) {
                    // NB: backtrack before re-parsing...
                    result = expr(pos);

                    // If the re-transduction positively progressed, update the memo and re-transduce again
                    if (result && len > memo.len) {
                        memo.len = len;
                        memo.ast = ast;
                        continue;
                    }

                    // Otherwise, go back to the last one that worked and stop...
                    break;
                }
            }

            else if (!memo.resolved) {
                // TODO: ...
                // We have re-entered this function at the same input position as the original call,
                // so we must have encountered a left-cycle. We simply flag the presence of the left-cycle
                // and return false, as explained in the previous switch case.
                return false;
            }

            // TODO: ...
            // If we get here, Memo is established - use it for the translation
            len = memo.len;
            ast = memo.ast;
            return memo.success;
        };
    }




    // ---------- built-in parsers ----------
    function i32(pos: number) {
        // TODO: parse up to MaxInt (how?)
        // TODO: negative ints
        // TODO: exponents
        const ZERO = '0'.charCodeAt(0);
        const NINE = '9'.charCodeAt(0);
        let c = text.charCodeAt(pos);
        if (c >= ZERO && c <= NINE) {
            len = 1;
            ast = c - ZERO;
            return true;
        }
        else {
            return false;
        }
    }

    // ---------- built-in combinators ----------
    function Selection(...expressions: Parser[]): Parser {
        return pos => {
            for (let expr of expressions) {
                if (expr(pos)) return true;
            }
            return false;
        };
    }

    function Sequence(...expressions: Parser[]): Parser {
        return pos => {
            let pos0 = pos;
            let astn: unknown = NOTHING;
            for (let expr of expressions) {
                if (!expr(pos)) return false;
                pos += len;
                astn = ast === NOTHING ? astn : ast;
            }
            len = pos - pos0;
            ast = astn;
            return true;
        };
    }

    function Record(fields: {[id: string]: Parser}): Parser {
        // TODO: doc... relies on prop order being preserved...
        return pos => {
            let pos0 = pos;
            let obj = {};
            for (let id in fields) {
                if (!fields.hasOwnProperty(id)) continue;
                let value = fields[id];
                if (!value(pos)) return false;
                pos += len;
                obj[id] = ast;
            }
            len = pos - pos0;
            ast = obj;
            return true;
        };
    }

    function Identifier(name: string): Parser {
        // TODO: ...
        return () => false;
    }

    function StringLiteral(value: string, onlyIn?: 'ast' | 'text'): Parser {
        return pos => {
            len = value.length;
            if (onlyIn !== 'ast') {
                for (let i = 0; i < len; ++i) {
                    if (text.charCodeAt(pos + i) !== value.charCodeAt(i)) return false;
                }
            }
            len = onlyIn === 'ast' ? 0 : len;
            ast = onlyIn === 'text' ? NOTHING : value;
            return true;
        };
    }
}
