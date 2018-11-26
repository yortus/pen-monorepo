const Unit = Symbol('unit');
type Unit = typeof Unit;
const Fail = Symbol('fail');
type Fail = typeof Fail;
type Node = string | number | object;
type ParseResult = Node | Unit | Fail;
type Parser = () => ParseResult; // side-effect: changes `pos`
declare const start: Parser;




export function parse(text: string) {

    // these two fns just make reading the code a bit easier. Will be more important when there is more state beside pos
    function consume(count: number) { position += count; }
    function restore(pos: number) { position = pos; }
    let position = 0;




    placeholder: {}




    debugger;
    let result = start();
    if (result === Fail) throw new Error(`parse failed`);
    if (position < text.length) throw new Error(`parse didn't consume entire input`);
    if (result === Unit) throw new Error(`parse didn't return a value`);
    return result;




    // ---------- wip... ----------
    function LeftRec(expr: Parser): Parser {
        interface Memo {
            resolved: boolean;
            consumed: number;
            result: ParseResult;
        }
        const memos = new Map<number, Memo>();

        return () => {
            let memo = memos.get(position);
            if (!memo) {
                // TODO: ...
                // Memo has just been created...
                // transduce and memoize the inner expession using a cycle-tolerant algorithm...
                memo = {resolved: false, consumed: 0, result: Unit};
                memos.set(position, memo);

                // TODO: ...
                let startPos = position;
                let result = expr(); // recurse... the memo will be updated...

                // We now have a fully resolved memo.
                memo.resolved = true;
                memo.consumed = position - startPos;
                memo.result = result;

                // TODO: If the preceding call to Transduce() succeeded...
                // Re-transduce from our initial position until we meet a stopping condition.
                // This will transduce left-cycles without getting caught in an infinite loop. It works as follows.
                // When the call to Transduce() below reaches a left-cyclic path, this method is reentered with
                // the same source position. But thanks to the preceding code, there is a resolved memo for this
                // position now. The method uses this memo and returns immediately, and transduction continues
                // beyond the left-cycle. We stop the re-transduction loop when it either fails or consumes no
                // further input (which could be due to right-cycles).
                while (result !== Fail) {
                    // NB: backtrack before re-parsing...
                    restore(startPos);
                    result = expr();

                    // If the re-transduction positively progressed, update the memo and re-transduce again
                    if (position - startPos <= memo.consumed) {
                        restore(startPos);
                        result = Fail;
                    }
                    if (result !== Fail) {
                        memo.consumed = position - startPos;
                        memo.result = result;
                    }
                }
            }

            else if (!memo.resolved) {
                // TODO: ...
                // We have re-entered this function at the same input position as the original call,
                // so we must have encountered a left-cycle. We simply flag the presence of the left-cycle
                // and return false, as explained in the previous switch case.
                return Fail;
            }

            // TODO: ...
            // If we get here, Memo is established - use it for the translation
            consume(memo.consumed);
            return memo.result;
        };
    }




    // ---------- built-in parsers ----------
    function i32() {
        // TODO: parse up to MaxInt (how?)
        // TODO: negative ints
        // TODO: exponents
        const ZERO = '0'.charCodeAt(0);
        const NINE = '9'.charCodeAt(0);
        let c = text.charCodeAt(position);
        if (c >= ZERO && c <= NINE) {
            consume(1);
            return c - ZERO;
        }
        else {
            return Fail;
        }
    }

    // ---------- built-in combinators ----------
    function Selection(...expressions: Parser[]): Parser {
        return () => {
            let result: ParseResult = Fail;
            for (let i = 0; i < expressions.length && result === Fail; ++i) {
                result = expressions[i]();
            }
            return result;
        };
    }

    function Sequence(...expressions: Parser[]): Parser {
        return () => {
            let startPos = position;
            let result: ParseResult = Unit;
            for (let i = 0; i < expressions.length && result !== Fail; ++i) {
                let next = expressions[i]();
                result = result === Unit ? next : result; // TODO: fix properly...
            }
            if (result === Fail) restore(startPos);
            return result;
        };
    }

    function Record(fields: {[id: string]: Parser}): Parser {
        // TODO: doc... relies on prop order being preserved...
        const fieldIds = Object.keys(fields);
        return () => {
            let startPos = position;
            let obj = {};
            let result: ParseResult = Unit;
            for (let i = 0; i < fieldIds.length && result !== Fail; ++i) {
                let id = fieldIds[i];
                result = obj[id] = fields[id]();
            }
            if (result !== Fail) return obj;
            restore(startPos);
            return Fail;
        };
    }

    function Identifier(name: string): Parser {
        // TODO: ...
        return () => Fail;
    }

    function StringLiteral(value: string, onlyIn?: 'ast' | 'text'): Parser {
        const len = value.length;
        return () => {
            if (onlyIn !== 'ast') {
                for (let i = 0; i < len; ++i) {
                    if (text.charCodeAt(position + i) !== value.charCodeAt(i)) return Fail;
                }
            }
            consume(onlyIn === 'ast' ? 0 : len);
            return onlyIn === 'text' ? Unit : value;
        };
    }
}
