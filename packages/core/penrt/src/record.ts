// TODO: doc... has only 'ast' representation

function createRecord(mode: 'parse' | 'print', recordItems: RecordItem[]) {
    return createRule(mode, {
        parse: {
            full: function RCD() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
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
                            if (!parseInner(recordItem.label, true)) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                            assert(AW === STRING);
                            APOS -= 1;
                            fieldLabel = AREP[APOS] as string;
                        }
                        if (fieldLabels.includes(fieldLabel)) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;

                        // Parse field value
                        if (!parseInner(recordItem.expr, true)) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;

                        const fieldValue = AREP[--APOS];
                        AREP[APOS++] = fieldLabel;
                        AREP[APOS++] = fieldValue;
                        fieldLabels.push(fieldLabel); // keep track of field labels to support duplicate detection
                    }
                    else /* item.kind === 'Splice' */ {
                        const apos = APOS;
                        if (!recordItem.expr()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                        for (let i = apos; i < APOS; i += 2) {
                            const fieldLabel = AREP[i] as string;
                            if (fieldLabels.includes(fieldLabel)) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                            fieldLabels.push(fieldLabel);
                        }
                    }
                }
                AW = RECORD;
                return true;
            },
            infer: function RCD() {
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
                            parseInferInner(recordItem.label.infer);
                            assert(AW === STRING);
                            APOS -= 1;
                            fieldLabel = AREP[APOS] as string;
                        }
                        if (fieldLabels.includes(fieldLabel)) return APOS = APOSₒ, false;

                        // Parse field value
                        parseInferInner(recordItem.expr.infer);

                        const fieldValue = AREP[--APOS];
                        AREP[APOS++] = fieldLabel;
                        AREP[APOS++] = fieldValue;
                        fieldLabels.push(fieldLabel); // keep track of field labels to support duplicate detection
                    }
                    else /* item.kind === 'Splice' */ {
                        const apos = APOS;
                        recordItem.expr.infer();
                        for (let i = apos; i < APOS; i += 2) {
                            const fieldLabel = AREP[i] as string;
                            if (fieldLabels.includes(fieldLabel)) throw new Error(`duplicate field label`); // TODO: inconsistent: parse() returns false for this
                            fieldLabels.push(fieldLabel);
                        }
                    }
                }
                AW = RECORD;
            },
        },
        print: {
            full: function RCD() {
                if (AR !== RECORD) return false;
                const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
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
                        return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                    }
                    else /* item.kind === 'Splice' */ {
                        APOS = bitmask;
                        AR = RECORD;
                        if (!recordItem.expr()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                        bitmask = APOS;
                    }
                }
                APOS = bitmask;
                return true;
            },
            infer: function RCD() {
                if (AR !== RECORD && AR !== NOTHING) return false;
                for (const recordItem of recordItems) {
                    if (recordItem.kind === 'Field') {
                        // Print field label
                        if (typeof recordItem.label !== 'string') {
                            // Dynamically-labelled field
                            printInferInner(recordItem.label.infer);
                        }

                        // Print field value
                        printInferInner(recordItem.expr.infer);
                    }
                    else /* item.kind === 'Splice' */ {
                        AR = RECORD;
                        recordItem.expr.infer();
                    }
                }
            },
        },
    });
}

type RecordItem =
    | {kind: 'Field', label: string | Rule, expr: Rule}
    | {kind: 'Splice', expr: Rule}
;
