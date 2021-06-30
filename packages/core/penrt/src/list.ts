// TODO: doc... has only abstract representation, no concrete representation

function createList(mode: 'parse' | 'print', listItems: ListItem[]) {
    return createRule(mode, {
        parse: function LST() {
            const [APOSₒ, CPOSₒ] = savepoint();
            if (APOS === 0) AREP = [];
            for (const listItem of listItems) {
                if (listItem.kind === 'Element') {
                    if (!parseInner(listItem.expr, true)) return backtrack(APOSₒ, CPOSₒ);
                }
                else /* item.kind === 'Splice' */ {
                    if (!listItem.expr()) return backtrack(APOSₒ, CPOSₒ);
                }
            }
            ATYP = LIST;
            return true;
        },

        parseDefault: function LST() {
            throw new Error('FIX_EMIT');
        },

        print: function LST() {
            if (ATYP !== LIST) return false;
            const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
            for (const listItem of listItems) {
                if (listItem.kind === 'Element') {
                    if (!printInner(listItem.expr, true)) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
                }
                else /* item.kind === 'Splice' */ {
                    ATYP = LIST;
                    if (!listItem.expr()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
                }
            }
            return true;
        },

        printDefault: function LST() {
            throw new Error('FIX_EMIT');
        },
    });
}

type ListItem =
    | {kind: 'Element', expr: Rule}
    | {kind: 'Splice', expr: Rule}
;
