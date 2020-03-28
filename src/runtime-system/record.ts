type Field =
    | {dynamic: false, name: string, value: Rule}
    | {dynamic: true, name: Rule, value: Rule};


function record(fields: Field[]): Rule {
    return {
        kind: 'rule',

        parse(text, pos, result) {
            let obj = {} as Record<string, unknown>;
            for (let field of fields) {
                let propName: string;
                if (field.dynamic) {
                    if (!field.name.parse(text, pos, result)) return false;
                    assert(typeof result.node === 'string');
                    propName = result.node;
                    pos = result.posᐟ;
                }
                else /* field.dynamic === false */ {
                    propName = field.name;
                }

                if (!field.value.parse(text, pos, result)) return false;
                assert(result.node !== undefined);
                obj[propName] = result.node;
                pos = result.posᐟ;
            }
            result.node = obj;
            result.posᐟ = pos;
            return true;
        },

        unparse(node, pos, result) {
            let text = '';
            if (!isPlainObject(node)) return false;

            let propNames = Object.keys(node); // TODO: doc reliance on prop order and what this means
            let propCount = propNames.length;
            assert(propCount <= 32); // TODO: document this limit, move to constant, consider how to remove it

            // TODO: O(n^2)? Can we do better? More fast paths for common cases?
            outerLoop:
            for (let field of fields) {
                // Find the first property key/value pair that matches this field name/value pair (if any)
                for (let i = 0; i < propCount; ++i) {
                    let propName = propNames[i];

                    // TODO: skip already-consumed key/value pairs
                    // tslint:disable-next-line: no-bitwise
                    const posIncrement = 1 << i;
                    // tslint:disable-next-line: no-bitwise
                    if ((pos & posIncrement) !== 0) continue;

                    // TODO: match field name
                    if (field.dynamic) {
                        if (!field.name.unparse(propName, 0, result)) continue;
                        if (result.posᐟ !== propName.length) continue;
                        text += result.text;
                    }
                    else /* field.dynamic === false */ {
                        if (propName !== field.name) continue;
                    }

                    // TODO: match field value
                    if (!field.value.unparse(node[propName], 0, result)) continue; // TODO: bug? modifies result without guarantee of returning true
                    if (!isFullyConsumed(node[propName], result.posᐟ)) continue;
                    text += result.text;

                    // TODO: we matched both name and value - consume them from `node`
                    pos += posIncrement;
                    continue outerLoop;
                }

                // If we get here, no match...
                return false;
            }
            result.text = text;
            result.posᐟ = pos;
            return true;
        },
    };
}
