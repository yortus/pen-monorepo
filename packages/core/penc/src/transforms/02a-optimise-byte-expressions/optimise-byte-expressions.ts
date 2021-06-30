import {makeNodeMapper, V, validateAST} from '../../representations';
import {assert} from '../../utils';


// TODO: temp testing...
// - StringLiteral --> ByteExpression for 1-byte string literals
// - `!byte1 !byte2 ... byteN` sequence --> ByteExpression
// - `byte1 | byte2 | ... | byteN` selection --> ByteExpression
export function optimiseByteExpressions(ast: V.AST<300>): V.AST<300> {
    validateAST(ast);

    const startᐟ = mapNode(ast.start, rec => ({

        // `abstract` operator on string literal or byte expr: apply statically where possible
        AbstractExpression: (ab): V.AbstractExpression<300> | V.ByteExpression<300> | V.StringLiteral<300> => {
            const expr = rec(ab.expression);
            if ((expr.kind === 'ByteExpression' || expr.kind === 'StringLiteral') && expr.subkind !== 'C') {
                return {...expr, subkind: 'A'};
            }
            else {
                return {...ab, expression: expr};
            }
        },

        // `concrete` operator on string literal or byte expr: apply statically where possible
        ConcreteExpression: (co): V.ConcreteExpression<300> | V.ByteExpression<300> | V.StringLiteral<300> => {
            const expr = rec(co.expression);
            if ((expr.kind === 'ByteExpression' || expr.kind === 'StringLiteral') && expr.subkind !== 'A') {
                return {...expr, subkind: 'C'};
            }
            else {
                return {...co, expression: expr};
            }
        },

        // One-byte string literals: convert to equivalent ByteExpression.
        StringLiteral: (str): V.StringLiteral<300> | V.ByteExpression<300> => {
            const buf = Buffer.from(str.value);
            if (buf.length > 1) return str;
            return {
                kind: 'ByteExpression',
                subkind: str.subkind,
                include: [buf[0]],
                default: buf[0],
            };
        },

        // `!byte1 !byte2 ... byteN` sequences: convert to equivalent ByteExpression.
        SequenceExpression: (seq): V.SequenceExpression<300> | V.ByteExpression<300> => {
            seq = {...seq, expressions: seq.expressions.map(rec)};
            let include: V.ByteExpression<300>['include'] = [];
            let exclude: Exclude<V.ByteExpression<300>['exclude'], undefined> = [];
            for (const expr of seq.expressions) {
                // TODO: ensure all ByteExprs have the same subkind...
                const isLast = expr === seq.expressions[seq.expressions.length - 1];
                if (!isLast) {
                    if (expr.kind !== 'NotExpression' || expr.expression.kind !== 'ByteExpression') break;
                    const be = expr.expression;
                    if (be.include.length !== 1 || be.exclude) break; // TODO: relax this? Only accepts simple ByteExprs for now
                    exclude.push(be.include[0]);
                }
                else {
                    if (expr.kind !== 'ByteExpression') break;
                    if (expr.include.length !== 1 || expr.exclude) break; // TODO: relax this? Only accepts simple ByteExprs for now
                    include.push(expr.include[0]);
                    const min = Array.isArray(expr.include[0]) ? expr.include[0][0]: expr.include[0];
                    // TODO: assert not excluded by anything in `exclude`
                    return {kind: 'ByteExpression', subkind: expr.subkind, include, exclude, default: min};
                }
            }

            // TODO: if we get here, doesn't fit the pattern sought above for optimisation. Return `seq` as-is.
            return seq;
        },

        // `byte1 | byte2 | ... | byteN` selections: convert to equivalent ByteExpression.
        SelectionExpression: (sel): V.SelectionExpression<300> | V.ByteExpression<300> => {
            sel = {...sel, expressions: sel.expressions.map(rec)};
            let include: V.ByteExpression<300>['include'] = [];
            for (const expr of sel.expressions) {
                // TODO: ensure all ByteExprs have the same subkind...
                if (expr.kind !== 'ByteExpression') break;
                if (expr.include.length !== 1 || expr.exclude) break; // TODO: relax this? Only accepts simple ByteExprs for now
                include.push(expr.include[0]);
                const isLast = expr === sel.expressions[sel.expressions.length - 1];
                if (isLast) {
                    const min = Array.isArray(include[0]) ? include[0][0]: include[0];
                    return {kind: 'ByteExpression', subkind: expr.subkind, include, default: min};
                }
            }

            // TODO: if we get here, doesn't fit the pattern sought above for optimisation. Return `sel` as-is.
            return sel;
        },
    }));

    // TODO: ...
    assert(startᐟ.kind === 'LetExpression');
    const astᐟ: V.AST<300> = {
        version: 300,
        start: startᐟ,
    };
    validateAST(astᐟ);
    return astᐟ;
}


// TODO: temp testing...
const mapNode = makeNodeMapper<300, 300>();
