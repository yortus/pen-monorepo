type Node = string | number | object;
type Unparser = (node: Node) => boolean; // side-effect: changes `text`
declare const start: Unparser;




export function unparse(ast: Node): string {

    // these two fns just make reading the code a bit easier. Will be more important when there is more state beside doc
    function produce(suffix: string) { doc += suffix; }
    function restore(s: string) { doc = s; }
    let doc = '';




    placeholder: {}




    debugger;
    let ret = start(ast);
    if (ret === false) throw new Error(`unparse failed`);
    return doc;




    // ---------- wip... ----------
    // function Memo(expr: Parser): Parser {
    //     interface Memo {
    //         resolved: boolean;
    //         consumed: number;
    //         result: ParseResult;
    //     }
    //     const memos = new Map<number, Memo>();

    //     return () => {
    //         let memo = memos.get(position);
    //         if (!memo) {
    //             // TODO: ...
    //             // Memo has just been created...
    //             // transduce and memoize the inner expession using a cycle-tolerant algorithm...
    //             memo = {resolved: false, consumed: 0, result: Unit};
    //             memos.set(position, memo);

    //             // TODO: ...
    //             let startPos = position;
    //             let result = expr(); // recurse... the memo will be updated...

    //             // We now have a fully resolved memo.
    //             memo.resolved = true;
    //             memo.consumed = position - startPos;
    //             memo.result = result;

    //             // TODO: If the preceding call to Transduce() succeeded...
    //             // Re-transduce from our initial position until we meet a stopping condition.
    //             // This will transduce left-cycles without getting caught in an infinite loop. It works as follows.
    //             // When the call to Transduce() below reaches a left-cyclic path, this method is reentered with
    //             // the same source position. But thanks to the preceding code, there is a resolved memo for this
    //             // position now. The method uses this memo and returns immediately, and transduction continues
    //             // beyond the left-cycle. We stop the re-transduction loop when it either fails or consumes no
    //             // further input (which could be due to right-cycles).
    //             while (result !== Fail) {
    //                 // NB: backtrack before re-parsing...
    //                 restore(startPos);
    //                 result = expr();

    //                 // If the re-transduction positively progressed, update the memo and re-transduce again
    //                 if (position - startPos <= memo.consumed) {
    //                     restore(startPos);
    //                     result = Fail;
    //                 }
    //                 if (result !== Fail) {
    //                     memo.consumed = position - startPos;
    //                     memo.result = result;
    //                 }
    //             }
    //         }

    //         else if (!memo.resolved) {
    //             // TODO: ...
    //             // We have re-entered this function at the same input position as the original call,
    //             // so we must have encountered a left-cycle. We simply flag the presence of the left-cycle
    //             // and return false, as explained in the previous switch case.
    //             return Fail;
    //         }

    //         // TODO: ...
    //         // If we get here, Memo is established - use it for the translation
    //         consume(memo.consumed);
    //         return memo.result;
    //     };
    // }




    // ---------- built-in parser combinators ----------
    function Selection(...expressions: Unparser[]): Unparser {
        return () => {
            let result: ParseResult = Fail;
            for (let i = 0; i < expressions.length && result === Fail; ++i) {
                result = expressions[i]();
            }
            return result;
        };
    }

    function Sequence(...expressions: Unparser[]): Unparser {
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

    function Record(fields: {[id: string]: Unparser}): Unparser {
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




    // ---------- built-in parser factories ----------
    function Identifier(name: string): Unparser {
        // TODO: ...
        return () => Fail;
    }

    function StringLiteral(value: string, onlyIn?: 'ast' | 'text'): Unparser {
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




    // ---------- other built-ins ----------
    function i32(node: Node) {

        // TODO: negative ints
        // TODO: exponents

        if (typeof node !== 'number') return false;
        if (node < 0) return false;
        // tslint:disable-next-line:no-bitwise
        let n = node | 0;
        if (n !== node) return false;
        produce(n.toString(10));
        return true;
    }
}
