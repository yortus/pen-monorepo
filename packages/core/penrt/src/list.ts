// TODO: doc... has only abstract representation, no concrete representation

function createList(mode: 'parse' | 'print', listItems: ListItem[]) {
    return createRule(mode, {
        parse: {
            full: function LST() {
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
            infer: function LST() {
                if (APOS === 0) AREP = [];
                for (const listItem of listItems) {
                    if (listItem.kind === 'Element') {
                        parseInferInner(listItem.expr.infer);
                    }
                    else /* item.kind === 'Splice' */ {
                        listItem.expr.infer();
                    }
                }
                AW = LIST;
            },
        },
        print: {
            full: function LST() {
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
            infer: function LST() {
                if (AR !== LIST && AR !== NOTHING) return false;
                for (const listItem of listItems) {
                    if (listItem.kind === 'Element') {
                        printInferInner(listItem.expr.infer);
                    }
                    else /* item.kind === 'Splice' */ {
                        AR = LIST;
                        listItem.expr.infer();
                    }
                }
            },
        },
    });
}

type ListItem =
    | {kind: 'Element', expr: Rule}
    | {kind: 'Splice', expr: Rule}
;
