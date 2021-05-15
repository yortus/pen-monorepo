// TODO: doc... has only 'ast' representation

function parseRecord(recordItems: RecordItem[]) {
    return function RCD() {
        const [APOSₒ, CPOSₒ] = savepoint();
        const fieldNames: string[] = [];
        for (const recordItem of recordItems) {
            if (recordItem.kind === 'Field') {
                // Parse field name
                let fieldName: string;
                if (typeof recordItem.name === 'string') {
                    // Statically-named field
                    fieldName = recordItem.name;
                }
                else {
                    // Dynamically-named field
                    if (!parseInner(recordItem.name, true)) return backtrack(APOSₒ, CPOSₒ);
                    assert(ATYP === STRING);
                    APOS -= 1;
                    fieldName = AREP[APOS] as string;
                }
                if (fieldNames.includes(fieldName)) return backtrack(APOSₒ, CPOSₒ);

                // Parse field value
                if (!parseInner(recordItem.expr, true)) return backtrack(APOSₒ, CPOSₒ);
                AREP[APOS - 1] = [fieldName, AREP[APOS - 1]]; // replace field value with field name/value pair
                fieldNames.push(fieldName); // keep track of field names to support duplicate detection
            }
            else /* item.kind === 'Splice' */ {
                const apos = APOS;
                if (!recordItem.expr()) return backtrack(APOSₒ, CPOSₒ);
                for (let i = apos; i < APOS; ++i) {
                    const fieldName = (AREP[i] as any)[0];
                    if (fieldNames.includes(fieldName)) return backtrack(APOSₒ, CPOSₒ);
                    fieldNames.push(fieldName);
                }
            }
        }
        ATYP = RECORD;
        return true;
    };
}

function printRecord(recordItems: RecordItem[]) {
    return function RCD() {
        if (ATYP !== RECORD) return false;
        const [APOSₒ, CPOSₒ, ATYPₒ] = savepoint();

        // const propNames = Object.keys(IN as any); // TODO: doc reliance on prop order and what this means
        const propList = AREP as Array<[name: string, value: unknown]>;
        const propCount = AREP.length;

        // TODO: temp testing...
        // const obj = IN as Record<string, unknown>;
        let bitmask = APOS;

        // TODO: O(n^2)? Can we do better? More fast paths for common cases?
        outerLoop:
        for (const recordItem of recordItems) {
            if (recordItem.kind === 'Field') {
                // Find the first property key/value pair that matches this field name/value pair (if any)
                for (let i = 0; i < propCount; ++i) {
                    let propName = propList[i][0];

                    // TODO: skip already-consumed key/value pairs
                    // tslint:disable-next-line: no-bitwise
                    const propBit = 1 << i;
                    // tslint:disable-next-line: no-bitwise
                    if ((bitmask & propBit) !== 0) continue;

                    // TODO: match field name
                    if (typeof recordItem.name !== 'string') {
                        // Dynamically-named field
                        AREP = propList[i];
                        APOS = 0;
                        if (!printInner(recordItem.name)) continue;
                    }
                    else {
                        // Statically-named field
                        if (propName !== recordItem.name) continue;
                    }

                    // TODO: match field value
                    AREP = propList[i];
                    APOS = 1;
                    if (!printInner(recordItem.expr)) continue;
            
                    // TODO: we matched both name and value - consume them from AREP
                    bitmask += propBit;
                    continue outerLoop;
                }

                // If we get here, no match... Ensure AREP is restored, since it may have been changed above.
                AREP = propList;
                return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
            }
            else /* item.kind === 'Splice' */ {
                AREP = propList;
                APOS = bitmask;
                ATYP = RECORD;
                if (!recordItem.expr()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
                bitmask = APOS;
            }
        }
        AREP = propList;
        APOS = bitmask;
        return true;
    }
}

type RecordItem =
    | {kind: 'Field', name: string | Rule, expr: Rule}
    | {kind: 'Splice', expr: Rule}
;
