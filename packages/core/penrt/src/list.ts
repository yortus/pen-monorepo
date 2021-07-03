// TODO: doc... has only abstract representation, no concrete representation

function createList(mode: 'parse' | 'print', listItems: ListItem[]) {
    return createRule(mode, {
        parse: function LST() {
            const [APOSₒ, CPOSₒ] = [APOS, CPOS];
            if (APOS === 0) AREP = [];
            for (const listItem of listItems) {
                if (listItem.kind === 'Element') {
                    if (!parseInner(listItem.expr, true)) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                }
                else /* item.kind === 'Splice' */ {
                    if (!listItem.expr()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                }
            }
            AW = LIST;
            return true;
        },

        parseDefault: function LST() {
            const APOSₒ = APOS;
            if (APOS === 0) AREP = [];
            for (const listItem of listItems) {
                if (listItem.kind === 'Element') {
                    if (!parseInner(listItem.expr.default, true)) return APOS = APOSₒ, false;
                }
                else /* item.kind === 'Splice' */ {
                    if (!listItem.expr.default()) return APOS = APOSₒ, false;
                }
            }
            AW = LIST;
            return true;
        },

        print: function LST() {
            if (AR !== LIST) return false;
            const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
            for (const listItem of listItems) {
                if (listItem.kind === 'Element') {
                    if (!printInner(listItem.expr, true)) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                }
                else /* item.kind === 'Splice' */ {
                    AR = LIST;
                    if (!listItem.expr()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                }
            }
            return true;
        },

        printDefault: function LST() {
            if (AR !== LIST && AR !== NOTHING) return false;
            const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
            for (const listItem of listItems) {
                if (listItem.kind === 'Element') {
                    if (!printDefaultInner(listItem.expr.default)) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                }
                else /* item.kind === 'Splice' */ {
                    AR = LIST;
                    if (!listItem.expr.default()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                }
            }
            return true;
        },
    });
}

type ListItem =
    | {kind: 'Element', expr: Rule}
    | {kind: 'Splice', expr: Rule}
;
