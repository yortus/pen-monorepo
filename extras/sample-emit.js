"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const EMPTY_NODE = Symbol('EmptyNode');
const NO_MATCH = { S: '__nomatch__', N: '__nomatch__' };




function parse(text) {

    // start
    function start(state) {
        return start.start(state);
    }
    start.start = expr;

    // expr
    function expr(state) {
        return expr.start(state);
    }
    expr.start = LeftRec(Selection(add, sub, term));

    // add
    function add(state) {
        return add.start(state);
    }
    add.start = Record({
        type: AbstractStringLiteral("add"),
        lhs: expr,
        rhs: Sequence(ADD, term)
    });

    // sub
    function sub(state) {
        return sub.start(state);
    }
    sub.start = Record({
        type: AbstractStringLiteral("sub"),
        lhs: expr,
        rhs: Sequence(SUB, term)
    });

    // term
    function term(state) {
        return term.start(state);
    }
    term.start = LeftRec(Selection(mul, div, factor));

    // mul
    function mul(state) {
        return mul.start(state);
    }
    mul.start = Record({
        type: AbstractStringLiteral("mul"),
        lhs: term,
        rhs: Sequence(MUL, factor)
    });

    // div
    function div(state) {
        return div.start(state);
    }
    div.start = Record({
        type: AbstractStringLiteral("div"),
        lhs: term,
        rhs: Sequence(DIV, factor)
    });

    // factor
    function factor(state) {
        return factor.start(state);
    }
    factor.start = Selection(i32, Sequence(LP, expr, RP));

    // ADD
    function ADD(state) {
        return ADD.start(state);
    }
    ADD.start = ConcreteStringLiteral("+");

    // SUB
    function SUB(state) {
        return SUB.start(state);
    }
    SUB.start = ConcreteStringLiteral("-");

    // MUL
    function MUL(state) {
        return MUL.start(state);
    }
    MUL.start = ConcreteStringLiteral("*");

    // DIV
    function DIV(state) {
        return DIV.start(state);
    }
    DIV.start = ConcreteStringLiteral("/");

    // LP
    function LP(state) {
        return LP.start(state);
    }
    LP.start = ConcreteStringLiteral("(");

    // RP
    function RP(state) {
        return RP.start(state);
    }
    RP.start = ConcreteStringLiteral(")");




    // let S = '';
    // let N = EmptyNode;
    // let Sᐟ = '';
    // let Nᐟ = EmptyNode;
    debugger;
    let ast = start({ S: text, N: EMPTY_NODE });
    if (ast === NO_MATCH)
        throw new Error(`parse failed`);
    if (ast.S.length > 0)
        throw new Error(`parse didn't consume entire input`);
    if (ast.N === EMPTY_NODE)
        throw new Error(`parse didn't return a value`);
    return ast.N;




    // ---------- wip... ----------
    function LeftRec(expr) {
        const memos = new Map();
        return state => {
            let memo = memos.get(state.S); // TODO: what about state.N, should that form part of memo's key? Investigate...
            if (!memo) {
                // TODO: ...
                // Memo has just been created...
                // transduce and memoize the inner expession using a cycle-tolerant algorithm...
                memo = { resolved: false, result: NO_MATCH };
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
                while (stateᐟ !== NO_MATCH) {
                    // TODO: REVIEW FROM HERE... ===>
                    stateᐟ = expr(state);
                    // If the re-transduction positively progressed, update the memo and re-transduce again
                    if (stateᐟ === NO_MATCH)
                        return memo.result;
                    if (stateᐟ.S.length >= memo.result.S.length)
                        return memo.result;
                    memo.result = stateᐟ;
                    // ...TO HERE ===>
                }
            }
            else if (!memo.resolved) {
                // TODO: ...
                // We have re-entered this function at the same input position as the original call,
                // so we must have encountered a left-cycle. We simply flag the presence of the left-cycle
                // and return false, as explained in the previous switch case.
                return NO_MATCH;
            }
            // TODO: ...
            // If we get here, Memo is established - use it for the translation
            return memo.result;
        };
    }




    // ---------- built-in parser combinators ----------
    function Selection(...expressions) {
        return state => {
            let stateᐟ = NO_MATCH;
            for (let i = 0; i < expressions.length && stateᐟ === NO_MATCH; ++i) {
                stateᐟ = expressions[i](state);
            }
            return stateᐟ;
        };
    }

    function Sequence(...expressions) {
        return state => {
            if (state === NO_MATCH)
                return NO_MATCH; // TODO: really want this atop every transcoder? why? why not?
            assert(state.N === EMPTY_NODE); // TODO: check... can sequences augment any existing node? eg when nested?
            let stateᐟ = state;
            for (let i = 0; i < expressions.length && stateᐟ !== NO_MATCH; ++i) {
                stateᐟ = expressions[i](stateᐟ);
            }
            return stateᐟ;
        };
    }

    function Record(fields) {
        // TODO: doc... relies on prop order being preserved...
        const fieldIds = Object.keys(fields);
        return state => {
            if (state === NO_MATCH)
                return NO_MATCH; // TODO: really want this atop every transcoder? why? why not?
            assert(state.N === EMPTY_NODE); // TODO: explain... records can't augment any existing node
            let S = state.S;
            let N = {};
            for (let id of fieldIds) {
                let result = fields[id]({ S, N: EMPTY_NODE });
                if (result === NO_MATCH)
                    return NO_MATCH;
                S = result.S;
                N[id] = result.N;
            }
            return { S, N };
        };
    }




    // ---------- built-in parser factories ----------
    function Identifier(name) {
        // TODO: ...
        return state => NO_MATCH;
    }

    function AbstractStringLiteral(value) {
        return state => {
            if (state === NO_MATCH)
                return NO_MATCH; // TODO: really want this atop every transcoder? why? why not?
            assert(state.N === EMPTY_NODE); // TODO: remove this limitation, augmentation should work
            return { S: state.S, N: value };
        };
    }

    function ConcreteStringLiteral(value) {
        return state => {
            if (state === NO_MATCH)
                return NO_MATCH; // TODO: really want this atop every transcoder? why? why not?
            if (!state.S.startsWith(value))
                return NO_MATCH;
            return { S: state.S.slice(value.length), N: state.N };
        };
    }

    function UniformStringLiteral(value) {
        return state => {
            if (state === NO_MATCH)
                return NO_MATCH; // TODO: really want this atop every transcoder? why? why not?
            assert(state.N === EMPTY_NODE); // TODO: remove this limitation, augmentation should work
            if (!state.S.startsWith(value))
                return NO_MATCH;
            return { S: state.S.slice(value.length), N: value };
        };
    }




    // ---------- other built-ins ----------
    function i32(state) {
        if (state === NO_MATCH)
            return NO_MATCH; // TODO: really want this atop every transcoder? why? why not?
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
            if (c < ZERO || c > NINE)
                break;
            // Check for overflow
            if (N > ONE_TENTH_MAXINT32) {
                return NO_MATCH;
            }
            // Update parsed number
            N *= 10;
            N += (c - ZERO);
            S = S.slice(1);
        }
        // Check that we parsed at least one digit
        if (S === state.S)
            return NO_MATCH;
        // TODO: sanity check over/under-flow. See eg:
        // https://github.com/dotnet/coreclr/blob/cdff8b0babe5d82737058ccdae8b14d8ae90160d/src/mscorlib/src/System/Number.cs#L518-L532
        // Success
        return { S, N };
    }
}




exports.parse = parse;
function assert(value) {
    if (!value)
        throw new Error(`Assertion failed`);
}
