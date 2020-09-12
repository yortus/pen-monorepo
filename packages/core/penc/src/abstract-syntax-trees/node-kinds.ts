import type {Node} from './nodes';


export type NodeKind = Node['kind'];


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
function makeNodeKindList<K extends NodeKind>(...kinds: K[]) {
    function without<X extends K>(...excluded: X[]) {
        let result = kinds.filter(k => !excluded.includes(k as any));
        return makeNodeKindList(...result as Array<Exclude<K, X>>);
    }
    return Object.assign([] as K[], kinds, {without});
}
