function list(elements: Rule[]): Rule {
    return {
        kind: 'rule',

        parse(text, pos, result) {
            let arr = [] as unknown[];
            for (let element of elements) {
                if (!element.parse(text, pos, result)) return false;
                assert(result.node !== undefined); // TODO: was NO_NODE. Does it mean the same thing?
                arr.push(result.node);
                pos = result.posᐟ;
            }
            result.node = arr;
            result.posᐟ = pos;
            return true;
        },

        unparse(node, pos, result) {
            let text = '';
            if (!Array.isArray(node)) return false;
            for (let element of elements) {
                if (pos >= node.length) return false;
                if (!element.unparse(node[pos], 0, result)) return false;
                if (!isFullyConsumed(node[pos], result.posᐟ)) return false;
                text += result.text;
                pos += 1;
            }
            result.text = text;
            result.posᐟ = pos;
            return true;
        },
    };
}
