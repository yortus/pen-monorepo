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
                        if (typeof recordItem.label === 'string') {
                            AREP[APOS++] = recordItem.label;
                        }
                        else {
                            if (!parseInner(recordItem.label, true)) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                            assert(AW === STRING);
                        }

                        // Keep track of field labels to support duplicate detection
                        if (fieldLabels.includes(AREP[APOS - 1] as string)) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                        fieldLabels.push(AREP[APOS - 1] as string);

                        // Parse field value
                        if (!parseInner(recordItem.expr, true)) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                    }
                    else /* item.kind === 'Splice' */ {
                        const apos = APOS;
                        if (!recordItem.expr()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;

                        // Keep track of field labels to support duplicate detection
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
                        if (typeof recordItem.label === 'string') {
                            AREP[APOS++] = recordItem.label;
                        }
                        else {
                            parseInferInner(recordItem.label.infer);
                            assert(AW === STRING);
                        }

                        // Keep track of field labels to support duplicate detection
                        if (fieldLabels.includes(AREP[APOS - 1] as string)) return APOS = APOSₒ, false;
                        fieldLabels.push(AREP[APOS - 1] as string);

                        // Parse field value
                        parseInferInner(recordItem.expr.infer);
                    }
                    else /* item.kind === 'Splice' */ {
                        const apos = APOS;
                        recordItem.expr.infer();

                        // Keep track of field labels to support duplicate detection
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
                const propCount = AREP.length >> 1;
                let bitmask = APOS;
                let i: number;
                for (const recordItem of recordItems) {
                    if (recordItem.kind === 'Field') {
                        // Match field label
                        if (typeof recordItem.label === 'string') {
                            for (i = 0, APOS = 1; (bitmask & (1 << i)) !== 0 && recordItem.label !== propList[i << 1]; ++i, APOS += 2) ;
                            if (i >= propCount) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                        }
                        else {
                            for (i = APOS = 0; (bitmask & (1 << i)) !== 0; ++i, APOS += 2) ;
                            if (i >= propCount || !printInner(recordItem.label, true)) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                        }

                        // Match field value
                        if (!printInner(recordItem.expr, true)) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                        bitmask += (1 << i);
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
                        if (typeof recordItem.label !== 'string') printInferInner(recordItem.label.infer);

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
