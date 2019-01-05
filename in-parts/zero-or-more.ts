function ZeroOrMore(expression: Codec): Codec {
    return {
        parse: (src, pos, result) => {
            let ast: unknown = NO_NODE;
            while (true) {
                if (!expression.parse(src, pos, result)) break;

                // TODO: check if any input was consumed...
                //       if not, stop iterating, since otherwise we may loop loop forever
                if (pos === result.posᐟ) break;

                // TODO: copypasta from Sequence above... make DRY
                pos = result.posᐟ;
                if (ast === NO_NODE) ast = result.ast;
                else if (typeof ast === 'string' && typeof result.ast === 'string') ast += result.ast;
                else if (Array.isArray(ast) && Array.isArray(result.ast)) ast = [...ast, ...result.ast];
                else if (isPlainObject(ast) && isPlainObject(result.ast)) ast = {...ast, ...result.ast};
                else if (result.ast !== NO_NODE) throw new Error(`Internal error: invalid sequence`);
            }

            result.ast = ast;
            result.posᐟ = pos;
            return true;
        },
        unparse: (ast, pos, result) => {
            let src = '';
            while (true) {
                if (!expression.unparse(ast, pos, result)) break;

                // TODO: check if any input was consumed...
                //       if not, stop iterating, since otherwise we may loop loop forever
                // TODO: any other checks needed? review...
                if (pos === result.posᐟ) break;
                src += result.src;
                pos = result.posᐟ;
            }

            result.src = src;
            result.posᐟ = pos;
            return true;
        },
    };
}
