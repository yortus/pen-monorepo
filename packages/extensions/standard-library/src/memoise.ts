function memoise(_options: StaticOptions): PenVal {
    return {
        bindings: {},
        parse: NOT_A_RULE,
        unparse: NOT_A_RULE,
        apply(expr) {

            // TODO: investigate... need to use `text` as part of memo key? Study lifecycle/extent of each `memos` instance.

            const parseMemos = new Map<
                unknown,
                Map<number, {
                    resolved: boolean,
                    isLeftRecursive: boolean,
                    result: boolean;
                    stateᐟ: Registers;
                }>
            >();

            // TODO: revise memo key once using new ast/pos signature
            const unparseMemos = new Map<
                unknown,
                Map<number, {
                    resolved: boolean,
                    isLeftRecursive: boolean,
                    result: boolean;
                    stateᐟ: Registers;
                }>
            >();

            return {
                bindings: {},

                parse() {
                    // Check whether the memo table already has an entry for the given initial state.
                    let stateₒ = getState();
                    let memos2 = parseMemos.get(IDOC);
                    if (memos2 === undefined) {
                        memos2 = new Map();
                        parseMemos.set(IDOC, memos2);
                    }
                    let memo = memos2.get(IMEM);
                    if (!memo) {
                        // The memo table does *not* have an entry, so this is the first attempt to apply this rule with
                        // this initial state. The first thing we do is create a memo table entry, which is marked as
                        // *unresolved*. All future applications of this rule with the same initial state will find this
                        // memo. If a future application finds the memo still unresolved, then we know we have encountered
                        // left-recursion.
                        memo = {resolved: false, isLeftRecursive: false, result: false, stateᐟ: stateₒ};
                        memos2.set(IMEM, memo);

                        // Now that the unresolved memo is in place, apply the rule, and resolve the memo with the result.
                        // At this point, any left-recursive paths encountered during application are guaranteed to have
                        // been noted and aborted (see below).
                        if (expr.parse()) {
                            memo.result = true;
                            memo.stateᐟ = getState();
                        }
                        memo.resolved = true;

                        // If we did *not* encounter left-recursion, then we have simple memoisation, and the result is
                        // final.
                        if (!memo.isLeftRecursive) {
                            setState(memo.stateᐟ);
                            return memo.result;
                        }

                        // If we get here, then the above application of the rule invoked itself left-recursively, but we
                        // aborted the left-recursive paths (see below). That means that the result is either failure, or
                        // success via a non-left-recursive path through the rule. We now iterate, repeatedly re-applying
                        // the same rule with the same initial state. We continue to iterate as long as the application
                        // succeeds and consumes more input than the previous iteration did, in which case we update the
                        // memo with the new result. We thus 'grow' the result, stopping when application either fails or
                        // does not consume more input, at which point we take the result of the previous iteration as
                        // final.
                        while (memo.result === true) {
                            setState(stateₒ);
                            if (!expr.parse()) break;
                            let state = getState();
                            if (state.IMEM <= memo.stateᐟ.IMEM) break;
                            memo.stateᐟ = state;
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
                    setState(memo.stateᐟ);
                    return memo.result;
                },

                unparse() {
                    // Check whether the memo table already has an entry for the given initial state.
                    let stateₒ = getState();
                    let memos2 = unparseMemos.get(IDOC);
                    if (memos2 === undefined) {
                        memos2 = new Map();
                        unparseMemos.set(IDOC, memos2);
                    }
                    let memo = memos2.get(IMEM);
                    if (!memo) {
                        // The memo table does *not* have an entry, so this is the first attempt to apply this rule with
                        // this initial state. The first thing we do is create a memo table entry, which is marked as
                        // *unresolved*. All future applications of this rule with the same initial state will find this
                        // memo. If a future application finds the memo still unresolved, then we know we have encountered
                        // left-recursion.
                        memo = {resolved: false, isLeftRecursive: false, result: false, stateᐟ: stateₒ};
                        memos2.set(IMEM, memo);

                        // Now that the unresolved memo is in place, apply the rule, and resolve the memo with the result.
                        // At this point, any left-recursive paths encountered during application are guaranteed to have
                        // been noted and aborted (see below).
                        if (expr.unparse()) {
                            memo.result = true;
                            memo.stateᐟ = getState();
                        }
                        memo.resolved = true;

                        // If we did *not* encounter left-recursion, then we have simple memoisation, and the result is
                        // final.
                        if (!memo.isLeftRecursive) {
                            setState(memo.stateᐟ);
                            return memo.result;
                        }

                        // If we get here, then the above application of the rule invoked itself left-recursively, but we
                        // aborted the left-recursive paths (see below). That means that the result is either failure, or
                        // success via a non-left-recursive path through the rule. We now iterate, repeatedly re-applying
                        // the same rule with the same initial state. We continue to iterate as long as the application
                        // succeeds and consumes more input than the previous iteration did, in which case we update the
                        // memo with the new result. We thus 'grow' the result, stopping when application either fails or
                        // does not consume more input, at which point we take the result of the previous iteration as
                        // final.
                        while (memo.result === true) {
                            setState(stateₒ);

                            // TODO: break cases:
                            // anything --> same thing (covers all string cases, since they can only be same or shorter)
                            // some node --> some different non-empty node (assert: should never happen!)
                            if (!expr.parse()) break;
                            let state = getState();
                            if (state.IMEM === memo.stateᐟ.IMEM) break;
                            if (!isFullyConsumed(state.IDOC, state.IMEM)) break;
                            memo.stateᐟ = state;
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
                    setState(memo.stateᐟ);
                    return memo.result;
                },

                apply: NOT_A_LAMBDA,
            };
        },
    };
}
