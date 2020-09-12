import type {Node} from './nodes';


export const bindingNodeKinds = makeNodeKindList(
    'GlobalBinding',
    'LocalBinding',
    'LocalMultiBinding',
);


export const expressionNodeKinds = makeNodeKindList(
    'ApplicationExpression',
    'BooleanLiteralExpression',
    'ExtensionExpression',
    'FieldExpression',
    'GlobalReferenceExpression',
    'ImportExpression',
    // 'LambdaExpression',
    'ListExpression',
    'LocalReferenceExpression',
    'MemberExpression',
    'ModuleExpression',
    'NotExpression',
    'NullLiteralExpression',
    'NumericLiteralExpression',
    'ParenthesisedExpression',
    'QuantifiedExpression',
    'RecordExpression',
    'SelectionExpression',
    'SequenceExpression',
    'StringLiteralExpression',
);


export const allNodeKinds = makeNodeKindList(
    'AbstractSyntaxTree',
    'Module',
    ...bindingNodeKinds,
    ...expressionNodeKinds,
);


// TODO: doc helper...
function makeNodeKindList<K extends Node['kind']>(...kinds: K[]) {

    function assert<K extends Node['kind']>(node: Node): asserts node is Node extends infer N ? (N extends {kind: K} ? N : never) : never {
        if (kinds.includes(node.kind as any)) return;
        throw new Error(`Unexpected node kind '${node.kind}'. Expected one of: '${kinds.join(`', '`)}'`);
    }

    function without<X extends K>(...excluded: X[]) {
        let result = kinds.filter(k => !excluded.includes(k as any));
        return makeNodeKindList(...result as Array<Exclude<K, X>>);
    }
    return Object.assign([] as K[], kinds, {assert, without});
}
