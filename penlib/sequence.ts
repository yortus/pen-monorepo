function Sequence(...expressions: Rule[]): Rule {
    const arity = expressions.length;
    return {
        parse: (src, pos, result) => {
            let ast: unknown = undefined;
            for (let i = 0; i < arity; ++i) {
                if (!expressions[i].parse(src, pos, result)) return false;
                pos = result.posᐟ;
                if (ast === undefined) ast = result.ast;
                else if (typeof ast === 'string' && typeof result.ast === 'string') ast += result.ast;
                else if (Array.isArray(ast) && Array.isArray(result.ast)) ast = [...ast, ...result.ast];
                else if (isPlainObject(ast) && isPlainObject(result.ast)) ast = {...ast, ...result.ast};
                else if (result.ast !== undefined) throw new Error(`Internal error: invalid sequence`);
            }
            result.ast = ast;
            result.posᐟ = pos;
            return true;
        },
        unparse: (ast, pos, result) => {
            let src = '';
            for (let i = 0; i < arity; ++i) {
                if (!expressions[i].unparse(ast, pos, result)) return false;
                // TODO: more sanity checking in here, like for parse...
                src += result.src;
                pos = result.posᐟ;
            }
            result.src = src;
            result.posᐟ = pos;
            return true;
        },
    };
}
