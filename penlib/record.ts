type Field =
    | {dynamic: false, name: string, value: Production}
    | {dynamic: true, name: Production, value: Production};




function record(fields: Field[]): Production {
    return {
        kind: 'production',
        parse: (src, pos, result) => {
            let obj = {} as any; // TODO: remove/improve cast
            for (let field of fields) {
                let id: string;
                if (field.dynamic) {
                    if (!field.name.parse(src, pos, result)) return false;
                    assert(typeof result.ast === 'string');
                    id = result.ast as string;
                    pos = result.posᐟ;
                }
                else /* field.dynamic === false */ {
                    id = field.name;
                }

                if (!field.value.parse(src, pos, result)) return false;
                assert(result.ast !== undefined);
                obj[id] = result.ast;
                pos = result.posᐟ;
            }
            result.ast = obj;
            result.posᐟ = pos;
            return true;
        },
        unparse: (ast, pos, result) => {
            let src = '';
            if (!isPlainObject(ast)) return false;

            // TODO: ...
            outerLoop:
            for (let field of fields) {
                // Find the first property key/value pair that matches this field name/value pair (if any)
                let propNames = Object.keys(ast);
                let propCount = propNames.length;
                assert(propCount <= 32);
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
                        src += result.src;
                    }
                    else /* field.dynamic === false */ {
                        if (propName !== field.name) continue;
                    }

                    // TODO: match field value
                    if (!field.value.unparse((ast as any)[propName], 0, result)) continue;
                    if (!isFullyConsumed((ast as any)[propName], result.posᐟ)) continue;
                    src += result.src;

                    // TODO: we matched both name and value - consume them from ast
                    pos += posIncrement;
                    continue outerLoop;
                }

                // If we get here, no match...
                return false;
            }
            result.src = src;
            result.posᐟ = pos;
            return true;
        },
    };
}
