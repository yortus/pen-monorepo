import {makeNodeMapper, V, validateAST} from '../../representations';
import {assert} from '../../utils';


// TODO: temp testing...
// - StringLiteral --> ByteExpression for 1-byte string literals
// - Sequence(!B !B B) --> ByteExpression
export function applyOptimisations(ast: V.AST<300>): V.AST<300> {
    validateAST(ast);

    const startᐟ = mapNode(ast.start, rec => ({
        StringLiteral: (str): V.StringLiteral | V.ByteExpression => {
            const buf = Buffer.from(str.value);
            if (str.isAbstract || buf.length > 1) return str;
            return {
                kind: 'ByteExpression',
                ranges: [{min: buf[0], max: buf[0]}],
            };
        },

        SequenceExpression: (seq): V.SequenceExpression<300> | V.ByteExpression => {
            seq = {...seq, expressions: seq.expressions.map(rec)};
            let ranges: V.ByteExpression['ranges'] = [];
            const canOpt = seq.expressions.every((ex, i) => {
                if (i < seq.expressions.length - 1) {
                    if (ex.kind !== 'NotExpression' || ex.expression.kind !== 'ByteExpression') return false;
                    ranges = ranges.concat(ex.expression.ranges.map(({min, max, isNegated}) => ({min, max, isNegated: !isNegated})));
                }
                else {
                    if (ex.kind !== 'ByteExpression') return false;
                    ranges = ranges.concat(ex.ranges);
                }
                return true;
            });
            if (!canOpt) return seq;

            // TODO: fix casts...
            return {kind: 'ByteExpression', ranges};
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
