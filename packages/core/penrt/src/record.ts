// TODO: doc... has only 'ast' representation

function createRecord(mode: 'parse' | 'print', recordItems: RecordItem[]) {
    return createRule(mode, {
        parse: function RCD() {
            const [APOSₒ, CPOSₒ] = savepoint();
            if (APOS === 0) AREP = [];
            const fieldLabels: string[] = [];
            for (const recordItem of recordItems) {
                if (recordItem.kind === 'Field') {
                    // Parse field label
                    let fieldLabel: string;
                    if (typeof recordItem.label === 'string') {
                        // Statically-labelled field
                        fieldLabel = recordItem.label;
                    }
                    else {
                        // Dynamically-labelled field
                        if (!parseInner(recordItem.label, true)) return backtrack(APOSₒ, CPOSₒ);
                        assert(ATYP === STRING);
                        APOS -= 1;
                        fieldLabel = AREP[APOS] as string;
                    }
                    if (fieldLabels.includes(fieldLabel)) return backtrack(APOSₒ, CPOSₒ);

                    // Parse field value
                    if (!parseInner(recordItem.expr, true)) return backtrack(APOSₒ, CPOSₒ);

                    const fieldValue = AREP[--APOS];
                    AREP[APOS++] = fieldLabel;
                    AREP[APOS++] = fieldValue;
                    fieldLabels.push(fieldLabel); // keep track of field labels to support duplicate detection
                }
                else /* item.kind === 'Splice' */ {
                    const apos = APOS;
                    if (!recordItem.expr()) return backtrack(APOSₒ, CPOSₒ);
                    for (let i = apos; i < APOS; i += 2) {
                        const fieldLabel = AREP[i] as string;
                        if (fieldLabels.includes(fieldLabel)) return backtrack(APOSₒ, CPOSₒ);
                        fieldLabels.push(fieldLabel);
                    }
                }
            }
            ATYP = RECORD;
            return true;
        },

        parseDefault: function RCD() {
            const APOSₒ = APOS;
            if (APOS === 0) AREP = [];
            const fieldLabels: string[] = [];
            for (const recordItem of recordItems) {
                if (recordItem.kind === 'Field') {
                    // Parse field label
                    let fieldLabel: string;
                    if (typeof recordItem.label === 'string') {
                        // Statically-labelled field
                        fieldLabel = recordItem.label;
                    }
                    else {
                        // Dynamically-labelled field
                        if (!parseInner(recordItem.label.default, true)) return APOS = APOSₒ, false;
                        assert(ATYP === STRING);
                        APOS -= 1;
                        fieldLabel = AREP[APOS] as string;
                    }
                    if (fieldLabels.includes(fieldLabel)) return APOS = APOSₒ, false;

                    // Parse field value
                    if (!parseInner(recordItem.expr.default, true)) return APOS = APOSₒ, false;

                    const fieldValue = AREP[--APOS];
                    AREP[APOS++] = fieldLabel;
                    AREP[APOS++] = fieldValue;
                    fieldLabels.push(fieldLabel); // keep track of field labels to support duplicate detection
                }
                else /* item.kind === 'Splice' */ {
                    const apos = APOS;
                    if (!recordItem.expr.default()) return APOS = APOSₒ, false;
                    for (let i = apos; i < APOS; i += 2) {
                        const fieldLabel = AREP[i] as string;
                        if (fieldLabels.includes(fieldLabel)) return APOS = APOSₒ, false;
                        fieldLabels.push(fieldLabel);
                    }
                }
            }
            ATYP = RECORD;
            return true;
        },

        print: function RCD() {
            if (ATYP !== RECORD) return false;
            const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
            const propList = AREP;
            const propCount = AREP.length;
            let bitmask = APOS;

            // TODO: O(n^2)? Can we do better? More fast paths for common cases?
            outerLoop:
            for (const recordItem of recordItems) {
                if (recordItem.kind === 'Field') {
                    // Find the first property key/value pair that matches this field label/value pair (if any)
                    for (let i = 0; i < propCount; ++i) {
                        let propName = propList[i << 1];

                        // TODO: skip already-consumed key/value pairs
                        // tslint:disable-next-line: no-bitwise
                        const propBit = 1 << i;
                        // tslint:disable-next-line: no-bitwise
                        if ((bitmask & propBit) !== 0) continue;

                        // TODO: match field label
                        if (typeof recordItem.label !== 'string') {
                            // Dynamically-labelled field
                            APOS = i << 1;
                            if (!printInner(recordItem.label, true)) continue;
                        }
                        else {
                            // Statically-labelled field
                            if (propName !== recordItem.label) continue;
                        }

                        // TODO: match field value
                        APOS = (i << 1) + 1;
                        if (!printInner(recordItem.expr, true)) continue;
                
                        // TODO: we matched both label and value - consume them from AREP
                        bitmask += propBit;
                        continue outerLoop;
                    }

                    // If we get here, no match... Ensure AREP is restored, since it may have been changed above.
                    return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
                }
                else /* item.kind === 'Splice' */ {
                    APOS = bitmask;
                    ATYP = RECORD;
                    if (!recordItem.expr()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
                    bitmask = APOS;
                }
            }
            APOS = bitmask;
            return true;
        },

        printDefault: function RCD() {
            if (ATYP !== RECORD) return false;
            const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
            for (const recordItem of recordItems) {
                if (recordItem.kind === 'Field') {
                    // Print field label
                    if (typeof recordItem.label !== 'string') {
                        // Dynamically-labelled field
                        if (!printDefaultInner(recordItem.label)) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
                    }

                    // Print field value
                    if (!printDefaultInner(recordItem.expr)) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
                }
                else /* item.kind === 'Splice' */ {
                    ATYP = RECORD;
                    if (!recordItem.expr()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
                }
            }
            return true;
        },
    });
}

type RecordItem =
    | {kind: 'Field', label: string | Rule, expr: Rule}
    | {kind: 'Splice', expr: Rule}
;
