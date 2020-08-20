

// TODO: temp testing...
export * from './ast';


// TODO: temp testing...
export const BindingKind = [
    'GlobalBinding',
    'LocalBinding',
    'LocalMultiBinding'
] as const;
export type BindingKind = (typeof BindingKind)[any];
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
export type ExpressionKind = (typeof ExpressionKind)[any];
export const NodeKind = ['Module', 'Program', ...BindingKind, ...ExpressionKind] as const;
export type NodeKind = (typeof NodeKind)[any];
