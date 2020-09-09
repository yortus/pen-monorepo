export type BindingNodeKind = typeof BindingNodeKind[any];
export const BindingNodeKind = [
    'GlobalBinding',
    'LocalBinding',
    'LocalMultiBinding',
] as const;


export type ExpressionNodeKind = typeof ExpressionNodeKind[any];
export const ExpressionNodeKind = [
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
] as const;


export type NodeKind = typeof NodeKind[any];
export const NodeKind = [
    'AbstractSyntaxTree',
    'Module',
    ...BindingNodeKind,
    ...ExpressionNodeKind,
] as const;
