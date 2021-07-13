import {makeNodeMapper, V, validateAST} from '../../representations';
import {assert} from '../../utils';


// TODO: jsdoc...
// - all subexprs of LetExpr#binding values have their own binding in the same binding map
export function flattenExpressions(ast: V.AST<300>): V.AST<400> {
    validateAST(ast);

    // TODO: doc...
    const startᐟ = mapNode(ast.start, rec => ({
        LetExpression: (le): V.LetExpression<400> => {
            // TODO: doc...
            const bindings: V.BindingMap<400> = {};
            for (const [name, value] of Object.entries(le.bindings)) addBinding(name, rec(value));

            // TODO: doc...
            let expression = rec(le.expression);
            if (expression.kind !== 'Identifier' && expression.kind !== 'FunctionParameter') {
                const name = addBinding('ꐚLET', expression);
                expression = {kind: 'Identifier', name};
            }

            // TODO: doc...
            return {...le, expression, bindings};

            // TODO: flatten each binding value (recursive)
            // TODO: inlined for now, but should be moved elsewhere
            function addBinding(baseName: string, e: V.Expression<400>): string {
                let [name, counter] = [baseName, 0];
                while (bindings.hasOwnProperty(name)) name = `${baseName}ᱻ${++counter}`;

                // TODO: explain... reserve the name so recursive calls don't claim it first
                bindings[name] = e;

                function ref(expr: V.Expression<400>): V.Identifier | V.FunctionParameter {
                    if (expr.kind === 'Identifier' || expr.kind === 'FunctionParameter') return expr;
                    const addedName = addBinding(baseName, expr); // recurse
                    return {kind: 'Identifier', name: addedName};
                }
        
                function setV<E extends V.Expression<400>>(expr: E, vals?: Omit<E, 'kind'>) {
                    bindings[name] = {...expr, ...vals};
                    return name; // TODO: explain... return the actual binding name used (may differ from baseName)
                }
        
                switch (e.kind) {
                    case 'AbstractExpression': return setV(e, {expression: ref(e.expression)});
                    case 'ApplicationExpression': return setV(e, {function: ref(e.function), argument: ref(e.argument)});
                    case 'BooleanLiteral': return setV(e);
                    case 'ByteExpression': return setV(e);
                    case 'ConcreteExpression': return setV(e, {expression: ref(e.expression)});
                    // TODO: special... should not be encountered here, since each funexpr would be a separate context
                    case 'FunctionExpression': return setV(e); // TODO: explain... already in the right form
                    case 'FunctionParameter': return setV(e);
                    case 'Identifier': return setV(e);
                    case 'Intrinsic': return setV(e);
                    case 'LetExpression': return setV(e); // TODO: doc this node was already handled in the depth-first mapNode traversal
                    case 'ListExpression': return setV(e, {items: e.items.map(it => it.kind === 'Splice'
                        ? {...it, expression: ref(it.expression)}
                        : ref(it)
                    )});
                    case 'MemberExpression': return setV(e, {module: ref(e.module), member: e.member});
                    case 'Module': return setV(e); // TODO: explain... already in the right form
                    case 'NotExpression': return setV(e, {expression: ref(e.expression)});
                    case 'NullLiteral': return setV(e);
                    case 'NumericLiteral': return setV(e);
                    case 'QuantifiedExpression': return setV(e, {expression: ref(e.expression), quantifier: e.quantifier});
                    case 'RecordExpression': return setV(e, {items: e.items.map(it => it.kind === 'Splice'
                        ? {...it, expression: ref(it.expression)}
                        : {...it, label: typeof it.label === 'string' ? it.label : ref(it.label), expression: ref(it.expression)}
                    )});
                    case 'SelectionExpression': return setV(e, {expressions: e.expressions.map(ref)});
                    case 'SequenceExpression': return setV(e, {expressions: e.expressions.map(ref)});
                    case 'StringLiteral': return setV(e);
                    default: ((assertNoKindsLeft: never) => { throw new Error(`Unhandled node ${assertNoKindsLeft}`); })(e);    
                }
            }
        },
    }));

    // TODO: ...
    assert(startᐟ.kind === 'LetExpression');
    const astᐟ: V.AST<400> = {
        version: 400,
        start: startᐟ,
    };
    validateAST(astᐟ);
    return astᐟ;
}


// TODO: temp testing...
const mapNode = makeNodeMapper<300, 400>();
