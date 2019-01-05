interface ListElement {
    type: 'element';
    value: Codec;
}




function List(elements: ListElement[]): Codec {
    return {
        parse: (src, pos, result) => {
            let arr = [] as Array<unknown>;
            for (let element of elements) {
                if (!element.value.parse(src, pos, result)) return false;
                assert(result.ast !== NO_NODE);
                arr.push(result.ast);
                pos = result.posᐟ;
            }
            result.ast = arr;
            result.posᐟ = pos;
            return true;
        },
        unparse: (ast, pos, result) => {
            let src = '';
            if (!Array.isArray(ast)) return false;

            for (let element of elements) {
                if (pos >= ast.length) return false;
                if (!element.value.unparse(ast[pos], 0, result)) return false;
                if (!isFullyConsumed(ast[pos], result.posᐟ)) return false;
                src += result.src;
                pos += 1;
            }
            result.src = src;
            result.posᐟ = pos;
            return true;
        },
    };
}
