// TODO: investigate... need to use `text` as part of memo key? Study lifecycle/extent of each `memos` instance.
function memoise(expr: Production): Production {

    const parseMemos = new Map<number, {
        resolved: boolean,
        isLeftRecursive: boolean,
        result: {node: unknown, posᐟ: number}
    }>();

    // TODO: revise memo key once using new ast/pos signature
    const unparseMemos = new Map<
        unknown,
        Map<number, {
            resolved: boolean,
            isLeftRecursive: boolean,
            result: {text: string, posᐟ: number}
        }>
    >();

    return {
        kind: 'production',

        parse(text, pos, result) {
            // Check whether the memo table already has an entry for the given initial state.
            let memo = parseMemos.get(pos);
            if (!memo) {
                // The memo table does *not* have an entry, so this is the first attempt to apply this rule with this
                // initial state. The first thing we do is create a memo table entry, which is marked as *unresolved*.
                // All future applications of this rule with the same initial state will find this memo. If a future
                // application finds the memo still unresolved, then we know we have encountered left-recursion.
                memo = {resolved: false, isLeftRecursive: false, result: {node: PARSE_FAIL, posᐟ: 0}};
                parseMemos.set(pos, memo);

                // Now that the unresolved memo is in place, apply the rule, and resolve the memo with the result. At
                // this point, any left-recursive paths encountered during application are guaranteed to have been noted
                // and aborted (see below).
                if (!expr.parse(text, pos, memo.result)) memo.result.node = PARSE_FAIL;
                memo.resolved = true;

                // If we did *not* encounter left-recursion, then we have simple memoisation, and the result is final.
                if (!memo.isLeftRecursive) {
                    Object.assign(result, memo.result);
                    return result.node !== PARSE_FAIL;
                }

                // If we get here, then the above application of the rule invoked itself left-recursively, but we
                // aborted the left-recursive paths (see below). That means that the result is either failure, or
                // success via a non-left-recursive path through the rule. We now iterate, repeatedly re-applying the
                // same rule with the same initial state. We continue to iterate as long as the application succeeds
                // and consumes more input than the previous iteration did, in which case we update the memo with the
                // new result. We thus 'grow' the result, stopping when application either fails or does not consume
                // more input, at which point we take the result of the previous iteration as final.
                while (memo.result.node !== PARSE_FAIL) {
                    if (!expr.parse(text, pos, result)) result.node = PARSE_FAIL;
                    if (result.node === PARSE_FAIL || result.posᐟ <= memo.result.posᐟ) break;
                    Object.assign(memo.result, result);
                }
            }
            else if (!memo.resolved) {
                // If we get here, then we have already applied the rule with this initial state, but not yet resolved
                // it. That means we must have entered a left-recursive path of the rule. All we do here is note that
                // the rule application encountered left-recursion, and return with failure. This means that the initial
                // application of the rule for this initial state can only possibly succeed along a non-left-recursive
                // path. More importantly, it means the parser will never loop endlessly on left-recursive rules.
                memo.isLeftRecursive = true;
                return false;
            }

            // We have a resolved memo, so the result of the rule application for the given initial state has already
            // been computed. Return it from the memo.
            Object.assign(result, memo.result);
            return result.node !== PARSE_FAIL;
        },

        unparse(node, pos, result) {
            // Check whether the memo table already has an entry for the given initial state.
            let memos2 = unparseMemos.get(node);
            if (memos2 === undefined) {
                memos2 = new Map();
                unparseMemos.set(node, memos2);
            }
            let memo = memos2.get(pos);
            if (!memo) {
                // The memo table does *not* have an entry, so this is the first attempt to apply this rule with this
                // initial state. The first thing we do is create a memo table entry, which is marked as *unresolved*.
                // All future applications of this rule with the same initial state will find this memo. If a future
                // application finds the memo still unresolved, then we know we have encountered left-recursion.
                memo = {resolved: false, isLeftRecursive: false, result: {text: UNPARSE_FAIL, posᐟ: 0}};
                memos2.set(pos, memo);

                // Now that the unresolved memo is in place, apply the rule, and resolve the memo with the result. At
                // this point, any left-recursive paths encountered during application are guaranteed to have been noted
                // and aborted (see below).
                if (!expr.unparse(node, pos, memo.result)) memo.result.text = UNPARSE_FAIL;
                memo.resolved = true;

                // If we did *not* encounter left-recursion, then we have simple memoisation, and the result is final.
                if (!memo.isLeftRecursive) {
                    Object.assign(result, memo.result);
                    return result.text !== UNPARSE_FAIL;
                }

                // If we get here, then the above application of the rule invoked itself left-recursively, but we
                // aborted the left-recursive paths (see below). That means that the result is either failure, or
                // success via a non-left-recursive path through the rule. We now iterate, repeatedly re-applying the
                // same rule with the same initial state. We continue to iterate as long as the application succeeds
                // and consumes more input than the previous iteration did, in which case we update the memo with the
                // new result. We thus 'grow' the result, stopping when application either fails or does not consume
                // more input, at which point we take the result of the previous iteration as final.
                while (memo.result.text !== UNPARSE_FAIL) {
                    if (!expr.unparse(node, pos, result)) result.text = UNPARSE_FAIL;

                    // TODO: break cases:
                    // anything --> same thing (covers all string cases, since they can only be same or shorter)
                    // some node --> some different non-empty node (assert: should never happen!)
                    if (result.text === UNPARSE_FAIL) break;
                    if (result.posᐟ === memo.result.posᐟ) break;
                    if (!isFullyConsumed(node, result.posᐟ)) break;
                    Object.assign(memo.result, result);
                }
            }
            else if (!memo.resolved) {
                // If we get here, then we have already applied the rule with this initial state, but not yet resolved
                // it. That means we must have entered a left-recursive path of the rule. All we do here is note that
                // the rule application encountered left-recursion, and return with failure. This means that the initial
                // application of the rule for this initial state can only possibly succeed along a non-left-recursive
                // path. More importantly, it means the parser will never loop endlessly on left-recursive rules.
                memo.isLeftRecursive = true;
                return false;
            }

            // We have a resolved memo, so the result of the rule application for the given initial state has already
            // been computed. Return it from the memo.
            Object.assign(result, memo.result);
            return result.text !== UNPARSE_FAIL;
        },
    };
}


const PARSE_FAIL = Symbol('FAIL');


// NB: this is an invalid code point (lead surrogate with no pair). It is used as a sentinel.
const UNPARSE_FAIL = '\uD800';
