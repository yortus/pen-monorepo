export type NodeKind =
    // Top-level nodes
    | 'AbstractSyntaxTree'
    | 'Module'
    | BindingKind
    | ExpressionKind
;


export type BindingKind = (typeof BindingKind)[any];
export const BindingKind = [
    'GlobalBinding',
    'LocalBinding',
    'LocalMultiBinding',
] as const;


export type ExpressionKind = (typeof ExpressionKind)[any];
export const ExpressionKind = [
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
