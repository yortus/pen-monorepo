function memoise(mode: 'parse' | 'print'): Func {
    return function MEM_function(expr) {
        // TODO: note this never gets cleared between parse/print calls. Would be ideal to be able to clear it somehow.
        const memos = new Map<
            unknown,
            Map<number, {
                resolved: boolean,
                isLeftRecursive: boolean,
                result: boolean;
                IPOSᐟ: number;
                OREPᐞ: Arrayish<unknown>;
                ATYPᐟ: ATYP;
            }>
        >();

        return createRule(mode, {
            parse: {
                full: function MEM() {
                    const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;

                    // Check whether the memo table already has an entry for the given initial state.
                    let memos2 = memos.get(IREP);
                    if (memos2 === undefined) {
                        memos2 = new Map();
                        memos.set(IREP, memos2);
                    }
                    let memo = memos2.get(IPOS);
                    if (!memo) {
                        // The memo table does *not* have an entry, so this is the first attempt to apply this rule with
                        // this initial state. The first thing we do is create a memo table entry, which is marked as
                        // *unresolved*. All future applications of this rule with the same initial state will find this
                        // memo. If a future application finds the memo still unresolved, then we know we have encountered
                        // left-recursion.
                        memo = {resolved: false, isLeftRecursive: false, result: false, IPOSᐟ: IPOSₒ, OREPᐞ: [], ATYPᐟ: NOTHING};
                        memos2.set(IPOS, memo);

                        // Now that the unresolved memo is in place, apply the rule, and resolve the memo with the result.
                        // At this point, any left-recursive paths encountered during application are guaranteed to have
                        // been noted and aborted (see below).
                        if ((expr as Rule)()) { // TODO: fix cast
                            memo.result = true;
                            memo.IPOSᐟ = IPOS;
                            memo.OREPᐞ = OREP.slice(OPOSₒ, OPOS);
                            memo.ATYPᐟ = ATYP;
                        }
                        memo.resolved = true;

                        // If we did *not* encounter left-recursion, then we have simple memoisation, and the result is
                        // final.
                        if (!memo.isLeftRecursive) {
                            // No-op. Fall through to exit code.
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
                            IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ;

                            // TODO: break cases for UNPARSING:
                            // anything --> same thing (covers all string cases, since they can only be same or shorter)
                            // some node --> some different non-empty node (assert: should never happen!)
                            if (!(expr as Rule)()) break; // TODO: fix cast
                            if (IPOS <= memo.IPOSᐟ) break;
                            // TODO: was for unparse... comment above says should never happen...
                            // if (!isInputFullyConsumed()) break;
                            memo.IPOSᐟ = IPOS;
                            memo.OREPᐞ = OREP.slice(OPOSₒ, OPOS);
                            memo.ATYPᐟ = ATYP;
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
                    ATYP = memo.ATYPᐟ;
                    OPOS = OPOSₒ;
                    IPOS = memo.IPOSᐟ;
                    for (let i = 0; i < memo.OREPᐞ.length; ++i) OREP[OPOS++] = memo.OREPᐞ[i];
                    return memo.result;
                },
                infer: function MEM() {
                    // TODO: implement...
                    throw new Error('memoise parse.infer: Not implemented');
                },
            },
            print: {
                full: function MEM() {
                    // TODO: do we ever want to memoise AST-->test? Eg for left-rec text-->text mappings?
                    // TODO: just pass-thru for now...
                    return (expr as Rule)();
                },
                infer: function MEM() {
                    // TODO: implement...
                    throw new Error('memoise print.infer: Not implemented');
                },
            },
        });
    };
}
