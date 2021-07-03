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
            ATYP = LIST;
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
            ATYP = LIST;
            return true;
        },

        print: function LST() {
            if (ATYP !== LIST) return false;
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            for (const listItem of listItems) {
                if (listItem.kind === 'Element') {
                    if (!printInner(listItem.expr, true)) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                }
                else /* item.kind === 'Splice' */ {
                    ATYP = LIST;
                    if (!listItem.expr()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                }
            }
            return true;
        },

        printDefault: function LST() {
            if (ATYP !== LIST && ATYP !== NOTHING) return false;
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            for (const listItem of listItems) {
                if (listItem.kind === 'Element') {
                    if (!printDefaultInner(listItem.expr.default)) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                }
                else /* item.kind === 'Splice' */ {
                    ATYP = LIST;
                    if (!listItem.expr.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
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
