{
    // start
    const start = defineRule(() => expr);
    // expr
    const expr = defineRule(() => Memo(Selection(add, sub, term)));
    // add
    const add = defineRule(() => Record([
        {
            type: "static",
            name: "type",
            value: AbstractStringLiteral("add")
        },
        {
            type: "static",
            name: "lhs",
            value: expr
        },
        {
            type: "static",
            name: "rhs",
            value: Sequence(ADD, term)
        }
    ]));
    // sub
    const sub = defineRule(() => Record([
        {
            type: "static",
            name: "type",
            value: AbstractStringLiteral("sub")
        },
        {
            type: "static",
            name: "lhs",
            value: expr
        },
        {
            type: "static",
            name: "rhs",
            value: Sequence(SUB, term)
        }
    ]));
    // term
    const term = defineRule(() => Memo(Selection(mul, div, factor)));
    // mul
    const mul = defineRule(() => Record([
        {
            type: "static",
            name: "type",
            value: AbstractStringLiteral("mul")
        },
        {
            type: "static",
            name: "lhs",
            value: term
        },
        {
            type: "static",
            name: "rhs",
            value: Sequence(MUL, factor)
        }
    ]));
    // div
    const div = defineRule(() => Record([
        {
            type: "static",
            name: "type",
            value: AbstractStringLiteral("div")
        },
        {
            type: "static",
            name: "lhs",
            value: term
        },
        {
            type: "static",
            name: "rhs",
            value: Sequence(DIV, factor)
        }
    ]));
    // factor
    const factor = defineRule(() => Selection(i32, Sequence(LP, expr, RP)));
    // ADD
    const ADD = defineRule(() => ConcreteStringLiteral("+"));
    // SUB
    const SUB = defineRule(() => ConcreteStringLiteral("-"));
    // MUL
    const MUL = defineRule(() => ConcreteStringLiteral("*"));
    // DIV
    const DIV = defineRule(() => ConcreteStringLiteral("/"));
    // LP
    const LP = defineRule(() => ConcreteStringLiteral("("));
    // RP
    const RP = defineRule(() => ConcreteStringLiteral(")"));
}



function AbstractCharRange(min: string, max: string): Codec {
    return {
        parse: (_, pos, result) => {
            result.ast = min;
            result.posᐟ = pos;
            return true;
        },
        unparse: (ast, pos, result) => {
            if (typeof ast !== 'string' || pos >= ast.length) return false;
            let c = ast.charAt(pos);
            if (c < min || c > max) return false;
            result.src = '';
            result.posᐟ = pos + 1;
            return true;
        },
    };
}




function ConcreteCharRange(min: string, max: string): Codec {
    return {
        parse: (src, pos, result) => {
            if (pos >= src.length) return false;
            let c = src.charAt(pos);
            if (c < min || c > max) return false;
            result.ast = NO_NODE;
            result.posᐟ = pos + 1;
            return true;
        },
        unparse: (_, pos, result) => {
            result.src = min;
            result.posᐟ = pos;
            return true;
        },
    };
}




function UniformCharRange(min: string, max: string): Codec {
    return {
        parse: (src, pos, result) => {
            if (pos >= src.length) return false;
            let c = src.charAt(pos);
            if (c < min || c > max) return false;
            result.ast = c;
            result.posᐟ = pos + 1;
            return true;
        },
        unparse: (ast, pos, result) => {
            if (typeof ast !== 'string' || pos >= ast.length) return false;
            let c = ast.charAt(pos);
            if (c < min || c > max) return false;
            result.src = c;
            result.posᐟ = pos + 1;
            return true;
        },
    };
}




function Char(): Codec {
    return {
        parse: (src, pos, result) => {
            if (pos >= src.length) return false;
            result.ast = src.charAt(pos);
            result.posᐟ = pos + 1;
            return true;
        },
        unparse: (ast, pos, result) => {
            if (typeof ast !== 'string' || pos >= ast.length) return false;
            result.src = ast.charAt(pos);
            result.posᐟ = pos + 1;
            return true;
        },
    };
}




function I32(): Codec {
    const UNICODE_ZERO_DIGIT = '0'.charCodeAt(0);
    const ONE_TENTH_MAXINT32 = 0x7FFFFFFF / 10;

    return {
        parse: (src, pos, result) => {
            // Parse optional leading '-' sign...
            let isNegative = false;
            if (pos < src.length && src.charAt(pos) === '-') {
                isNegative = true;
                pos += 1;
            }

            // ...followed by one or more decimal digits. (NB: no exponents).
            let num = 0;
            let digits = 0;
            while (pos < src.length) {

                // Read a digit
                let c = src.charCodeAt(pos);
                if (c < UNICODE_ZERO_DIGIT || c > UNICODE_ZERO_DIGIT + 9) break;

                // Check for overflow
                if (num > ONE_TENTH_MAXINT32) {
                    return false;
                }

                // Update parsed number
                num *= 10;
                num += (c - UNICODE_ZERO_DIGIT);
                pos += 1;
                digits += 1;
            }

            // Check that we parsed at least one digit.
            if (digits === 0) return false;

            // Apply the sign.
            if (isNegative) num = -num;

            // Check for over/under-flow. This *is* needed to catch -2147483649, 2147483648 and 2147483649.
            if (isNegative ? (num & 0xFFFFFFFF) >= 0 : (num & 0xFFFFFFFF) < 0) return false;

            // Success
            result.ast = num;
            result.posᐟ = pos;
            return true;
        },
        unparse: (ast, pos, result) => {
            // TODO: ensure N is a 32-bit integer
            if (typeof ast !== 'number' || pos !== 0) return false;
            let num = ast;
            if ((num & 0xFFFFFFFF) !== num) return false;

            // TODO: check sign...
            let isNegative = false;
            if (num < 0) {
                isNegative = true;
                if (num === -2147483648) {
                    // Specially handle the one case where N = -N could overflow
                    result.src = '-2147483648';
                    result.posᐟ = 1;
                    return true;
                }
                num = -num as number;
            }

            // TODO: ...then digits
            let digits = [] as string[];
            while (true) {
                let d = num % 10;
                num = (num / 10) | 0;
                digits.push(String.fromCharCode(UNICODE_ZERO_DIGIT + d));
                if (num === 0) break;
            }

            // TODO: compute final string...
            if (isNegative) digits.push('-');
            result.src = digits.reverse().join('');
            result.posᐟ = 1;
            return true;
        },
    };
}




interface ListElement {
    type: 'element';
    value: Codec;
}




function List(elements: ListElement[]): Codec {
    return {
        parse: (src, pos, result) => {
            let arr = [] as Array<unknown>;
            for (let element of elements) {
                if (!element.value.parse(src, pos, result)) return false;
                assert(result.ast !== NO_NODE);
                arr.push(result.ast);
                pos = result.posᐟ;
            }
            result.ast = arr;
            result.posᐟ = pos;
            return true;
        },
        unparse: (ast, pos, result) => {
            let src = '';
            if (!Array.isArray(ast)) return false;

            for (let element of elements) {
                if (pos >= ast.length) return false;
                if (!element.value.unparse(ast[pos], 0, result)) return false;
                if (!isFullyConsumed(ast[pos], result.posᐟ)) return false;
                src += result.src;
                pos += 1;
            }
            result.src = src;
            result.posᐟ = pos;
            return true;
        },
    };
}




function Memo(expr: Codec): Codec {

    // TODO: investigate... need to use `text` as part of memo key? Study lifecycle/extent of each `memos` instance.
    const FAIL = Symbol('FAIL');
    const memos = new Map<
        number,
        {resolved: boolean, isLeftRecursive: boolean, result: {ast: unknown, posᐟ: number}}
    >();
    const UNFAIL = '\uD800'; // NB: this invalid code point (lead surrogate with no pair) is used as a sentinel.
    const unmemos = new Map<
        unknown,
        Map<
            number,
            {resolved: boolean, isLeftRecursive: boolean, result: {src: string, posᐟ: number}}
        >
    >();

    return {

        parse: (src, pos, result) => {
            // Check whether the memo table already has an entry for the given initial state.
            let memo = memos.get(pos);
            if (!memo) {
                // The memo table does *not* have an entry, so this is the first attempt to apply this rule with
                // this initial state. The first thing we do is create a memo table entry, which is marked as
                // *unresolved*. All future applications of this rule with the same initial state will find this
                // memo. If a future application finds the memo still unresolved, then we know we have encountered
                // left-recursion.
                memo = {resolved: false, isLeftRecursive: false, result: {ast: FAIL, posᐟ: 0}};
                memos.set(pos, memo);

                // Now that the unresolved memo is in place, apply the rule, and resolve the memo with the result.
                // At this point, any left-recursive paths encountered during application are guaranteed to have
                // been noted and aborted (see below).
                if (!expr.parse(src, pos, memo.result)) memo.result.ast = FAIL;
                memo.resolved = true;

                // If we did *not* encounter left-recursion, then we have simple memoisation, and the result is
                // final.
                if (!memo.isLeftRecursive) {
                    Object.assign(result, memo.result);
                    return result.ast !== FAIL;
                }

                // If we get here, then the above application of the rule invoked itself left-recursively, but we
                // aborted the left-recursive paths (see below). That means that the result is either failure, or
                // success via a non-left-recursive path through the rule. We now iterate, repeatedly re-applying
                // the same rule with the same initial state. We continue to iterate as long as the application
                // succeeds and consumes more input than the previous iteration did, in which case we update the
                // memo with the new result. We thus 'grow' the result, stopping when application either fails or
                // does not consume more input, at which point we take the result of the previous iteration as
                // final.
                while (memo.result.ast !== FAIL) {
                    if (!expr.parse(src, pos, result)) result.ast = FAIL;
                    if (result.ast === FAIL || result.posᐟ <= memo.result.posᐟ) break;
                    Object.assign(memo.result, result);
                }
            }
            else if (!memo.resolved) {
                // If we get here, then we have already applied the rule with this initial state, but not yet
                // resolved it. That means we must have entered a left-recursive path of the rule. All we do here is
                // note that the rule application encountered left-recursion, and return with failure. This means
                // that the initial application of the rule for this initial state can only possibly succeed along a
                // non-left-recursive path. More importantly, it means the parser will never loop endlessly on
                // left-recursive rules.
                memo.isLeftRecursive = true;
                return false;
            }

            // We have a resolved memo, so the result of the rule application for the given initial state has
            // already been computed. Return it from the memo.
            Object.assign(result, memo.result);
            return result.ast !== FAIL;
        },

        unparse: (ast, pos, result) => {
            // Check whether the memo table already has an entry for the given initial state.
            let memos2 = unmemos.get(ast);
            if (memos2 === undefined) unmemos.set(ast, memos2 = new Map());
            let memo = memos2.get(pos);
            if (!memo) {
                // The memo table does *not* have an entry, so this is the first attempt to apply this rule with
                // this initial state. The first thing we do is create a memo table entry, which is marked as
                // *unresolved*. All future applications of this rule with the same initial state will find this
                // memo. If a future application finds the memo still unresolved, then we know we have encountered
                // left-recursion.
                memo = {resolved: false, isLeftRecursive: false, result: {src: UNFAIL, posᐟ: 0}};
                memos2.set(pos, memo);

                // Now that the unresolved memo is in place, apply the rule, and resolve the memo with the result.
                // At this point, any left-recursive paths encountered during application are guaranteed to have
                // been noted and aborted (see below).
                if (!expr.unparse(ast, pos, memo.result)) memo.result.src = UNFAIL;
                memo.resolved = true;

                // If we did *not* encounter left-recursion, then we have simple memoisation, and the result is
                // final.
                if (!memo.isLeftRecursive) {
                    Object.assign(result, memo.result);
                    return result.src !== UNFAIL;
                }

                // If we get here, then the above application of the rule invoked itself left-recursively, but we
                // aborted the left-recursive paths (see below). That means that the result is either failure, or
                // success via a non-left-recursive path through the rule. We now iterate, repeatedly re-applying
                // the same rule with the same initial state. We continue to iterate as long as the application
                // succeeds and consumes more input than the previous iteration did, in which case we update the
                // memo with the new result. We thus 'grow' the result, stopping when application either fails or
                // does not consume more input, at which point we take the result of the previous iteration as
                // final.
                while (memo.result.src !== UNFAIL) {
                    if (!expr.unparse(ast, pos, result)) result.src = UNFAIL;

                    // TODO: break cases:
                    // anything --> same thing (covers all string cases, since they can only be same or shorter)
                    // some node --> some different non-empty node (assert: should never happen!)
                    if (result.src === UNFAIL) break;
                    if (result.posᐟ === memo.result.posᐟ) break;
                    if (!isFullyConsumed(ast, result.posᐟ)) break;
                    Object.assign(memo.result, result);
                }
            }
            else if (!memo.resolved) {
                // If we get here, then we have already applied the rule with this initial state, but not yet
                // resolved it. That means we must have entered a left-recursive path of the rule. All we do here is
                // note that the rule application encountered left-recursion, and return with failure. This means
                // that the initial application of the rule for this initial state can only possibly succeed along a
                // non-left-recursive path. More importantly, it means the parser will never loop endlessly on
                // left-recursive rules.
                memo.isLeftRecursive = true;
                return false;
            }

            // We have a resolved memo, so the result of the rule application for the given initial state has
            // already been computed. Return it from the memo.
            Object.assign(result, memo.result);
            return result.src !== UNFAIL;
        },

    };
}




type RecordField =
    | {type: 'static', name: string, value: Codec}
    | {type: 'computed', name: Codec, value: Codec};




function Record(fields: RecordField[]): Codec {
    return {

        parse: (src, pos, result) => {
            let obj = {} as any; // TODO: remove/improve cast
            for (let field of fields) {
                let id: string;
                if (field.type === 'computed') {
                    if (!field.name.parse(src, pos, result)) return false;
                    assert(typeof result.ast === 'string');
                    id = result.ast as string;
                    pos = result.posᐟ;
                }
                else /* field.type === 'static' */ {
                    id = field.name;
                }

                if (!field.value.parse(src, pos, result)) return false;
                assert(result.ast !== NO_NODE);
                obj[id] = result.ast;
                pos = result.posᐟ;
            }
            result.ast = obj;
            result.posᐟ = pos;
            return true;
        },

        unparse: (ast, pos, result) => {
            let src = '';
            if (!isPlainObject(ast)) return false;

            // TODO: ...
            outerLoop:
            for (let field of fields) {
                // Find the first property key/value pair that matches this field name/value pair (if any)
                let propNames = Object.keys(ast);
                let propCount = propNames.length;
                assert(propCount <= 32);
                for (let i = 0; i < propCount; ++i) {
                    let propName = propNames[i];

                    // TODO: skip already-consumed key/value pairs
                    const posIncrement = 1 << i;
                    if ((pos & posIncrement) !== 0) continue;

                    // TODO: match field name
                    if (field.type === 'computed') {
                        if (!field.name.unparse(propName, 0, result)) continue;
                        if (result.posᐟ !== propName.length) continue;
                        src += result.src;
                    }
                    else /* field.type === 'static' */ {
                        if (propName !== field.name) continue;
                    }

                    // TODO: match field value
                    if (!field.value.unparse((ast as any)[propName], 0, result)) continue;
                    if (!isFullyConsumed((ast as any)[propName], result.posᐟ)) continue;
                    src += result.src;

                    // TODO: we matched both name and value - consume them from ast
                    pos += posIncrement;
                    continue outerLoop;
                }

                // If we get here, no match...
                return false;
            }
            result.src = src;
            result.posᐟ = pos;
            return true;
        },

    };
}




function Selection(...expressions: Codec[]): Codec {
    const arity = expressions.length;
    return {
        parse: (src, pos, result) => {
            for (let i = 0; i < arity; ++i) {
                if (expressions[i].parse(src, pos, result)) return true;
            }
            return false;
        },
        unparse: (ast, pos, result) => {
            for (let i = 0; i < arity; ++i) {
                if (expressions[i].unparse(ast, pos, result)) return true;
            }
            return false;
        },
    };
}




function Sequence(...expressions: Codec[]): Codec {
    const arity = expressions.length;
    return {
        parse: (src, pos, result) => {
            let ast: unknown = NO_NODE;
            for (let i = 0; i < arity; ++i) {
                if (!expressions[i].parse(src, pos, result)) return false;
                pos = result.posᐟ;
                if (ast === NO_NODE) ast = result.ast;
                else if (typeof ast === 'string' && typeof result.ast === 'string') ast += result.ast;
                else if (Array.isArray(ast) && Array.isArray(result.ast)) ast = [...ast, ...result.ast];
                else if (isPlainObject(ast) && isPlainObject(result.ast)) ast = {...ast, ...result.ast};
                else if (result.ast !== NO_NODE) throw new Error(`Internal error: invalid sequence`);
            }
            result.ast = ast;
            result.posᐟ = pos;
            return true;
        },
        unparse: (ast, pos, result) => {
            let src = '';
            for (let i = 0; i < arity; ++i) {
                if (!expressions[i].unparse(ast, pos, result)) return false;
                // TODO: more sanity checking in here, like for parse...
                src += result.src;
                pos = result.posᐟ;
            }
            result.src = src;
            result.posᐟ = pos;
            return true;
        },
    };
}




function AbstractStringLiteral(value: string): Codec {
    return {
        parse: (_, pos, result) => {
            result.ast = value;
            result.posᐟ = pos;
            return true;
        },
        unparse: (ast, pos, result) => {
            if (typeof ast !== 'string' || !matchesAt(ast, value, pos)) return false;
            result.src = '';
            result.posᐟ = pos + value.length;
            return true;
        },
    };
}

function ConcreteStringLiteral(value: string): Codec {
    return {
        parse: (src, pos, result) => {
            if (!matchesAt(src, value, pos)) return false;
            result.ast = NO_NODE;
            result.posᐟ = pos + value.length;
            return true;
        },
        unparse: (_, pos, result) => {
            result.src = value;
            result.posᐟ = pos;
            return true;
        },
    };
}

function UniformStringLiteral(value: string): Codec {
    return {
        parse: (src, pos, result) => {
            if (!matchesAt(src, value, pos)) return false;
            result.ast = value;
            result.posᐟ = pos + value.length;
            return true;
        },
        unparse: (ast, pos, result) => {
            if (typeof ast !== 'string' || !matchesAt(ast, value, pos)) return false;
            result.src = value;
            result.posᐟ = pos + value.length;
            return true;
        },
    };
}




// export type Parser = (src: string, pos: number, result: {ast: unknown, posᐟ: number}) => boolean;
// export type Unparser = (ast: unknown, pos: number, result: {src: string, posᐟ: number}) => boolean;
interface Codec {
    parse: (src: string, pos: number, result: {ast: unknown, posᐟ: number}) => boolean;
    unparse: (ast: unknown, pos: number, result: {src: string, posᐟ: number}) => boolean;
}




const NO_NODE = Symbol('NoNode');




function defineRule(init: () => Codec) {
    let result: Codec = {
        parse(src, pos, res) {
            let rule = init();
            result.parse = rule.parse;
            result.unparse = rule.unparse;
            return rule.parse(src, pos, res);
        },
        unparse(ast, pos, res) {
            let rule = init();
            result.parse = rule.parse;
            result.unparse = rule.unparse;
            return rule.unparse(ast, pos, res);
        },
    };
    return result;
}




function isFullyConsumed(ast: unknown, pos: number) {
    if (typeof ast === 'string') return pos === ast.length;
    if (Array.isArray(ast)) return pos === ast.length;
    if (isPlainObject(ast)) {
        let keyCount = Object.keys(ast).length;
        assert(keyCount <= 32);
        if (keyCount === 0) return true;
        return pos = -1 >>> (32 - keyCount);
    }
    return pos === 1;
}




function isPlainObject(value: unknown): value is object {
    return value !== null && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype;
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




function ZeroOrMore(expression: Codec): Codec {
    return {
        parse: (src, pos, result) => {
            let ast: unknown = NO_NODE;
            while (true) {
                if (!expression.parse(src, pos, result)) break;

                // TODO: check if any input was consumed...
                //       if not, stop iterating, since otherwise we may loop loop forever
                if (pos === result.posᐟ) break;

                // TODO: copypasta from Sequence above... make DRY
                pos = result.posᐟ;
                if (ast === NO_NODE) ast = result.ast;
                else if (typeof ast === 'string' && typeof result.ast === 'string') ast += result.ast;
                else if (Array.isArray(ast) && Array.isArray(result.ast)) ast = [...ast, ...result.ast];
                else if (isPlainObject(ast) && isPlainObject(result.ast)) ast = {...ast, ...result.ast};
                else if (result.ast !== NO_NODE) throw new Error(`Internal error: invalid sequence`);
            }

            result.ast = ast;
            result.posᐟ = pos;
            return true;
        },
        unparse: (ast, pos, result) => {
            let src = '';
            while (true) {
                if (!expression.unparse(ast, pos, result)) break;

                // TODO: check if any input was consumed...
                //       if not, stop iterating, since otherwise we may loop loop forever
                // TODO: any other checks needed? review...
                if (pos === result.posᐟ) break;
                src += result.src;
                pos = result.posᐟ;
            }

            result.src = src;
            result.posᐟ = pos;
            return true;
        },
    };
}




function True(): Codec {
    return {
        parse: (_, pos, result) => {
            result.ast = true;
            result.posᐟ = pos;
            return true;
        },
        unparse: (ast, pos, result) => {
            if (ast !== true || pos !== 0) return false;
            result.src = '';
            result.posᐟ = 1;
            return true;
        },
    };
}




function False(): Codec {
    return {
        parse: (_, pos, result) => {
            result.ast = false;
            result.posᐟ = pos;
            return true;
        },
        unparse: (ast, pos, result) => {
            if (ast !== false || pos !== 0) return false;
            result.src = '';
            result.posᐟ = 1;
            return true;
        },
    };
}




function Null(): Codec {
    return {
        parse: (_, pos, result) => {
            result.ast = null;
            result.posᐟ = pos;
            return true;
        },
        unparse: (ast, pos, result) => {
            if (ast !== null || pos !== 0) return false;
            result.src = '';
            result.posᐟ = 1;
            return true;
        },
    };
}




function Maybe(expression: Codec): Codec {
    const epsilon = Epsilon();
    return {
        parse: (src, pos, result) => {
            if (expression.parse(src, pos, result)) return true;
            return epsilon.parse(src, pos, result);
        },
        unparse: (ast, pos, result) => {
            if (expression.unparse(ast, pos, result)) return true;
            return epsilon.unparse(ast, pos, result);
            },
    };
}




function Not(expression: Codec): Codec {
    const epsilon = Epsilon();
    return {
        parse: (src, pos, result) => {
            if (expression.parse(src, pos, result)) return false;
            return epsilon.parse(src, pos, result);
        },
        unparse: (ast, pos, result) => {
            if (expression.unparse(ast, pos, result)) return false;
            return epsilon.unparse(ast, pos, result);
        },
    };
}




function Epsilon(): Codec {
    return {
        parse: (_, pos, result) => {
            result.ast = NO_NODE;
            result.posᐟ = pos;
            return true;
        },
        unparse: (_, pos, result) => {
            result.src = '';
            result.posᐟ = pos;
            return true;
        },
    };
}
