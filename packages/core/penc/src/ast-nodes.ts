

// TODO: temp testing...
export * from './ast';


// TODO: temp testing...
export const BindingKind = ['GlobalBinding', 'LocalBinding', 'LocalMultiBinding'] as const;
export type BindingKind = (typeof BindingKind)[any];
export const ExpressionKind = [
    'ApplicationExpression', 'BooleanLiteralExpression', 'ExtensionExpression', 'FieldExpression', 'ImportExpression',
    /*'LambdaExpression', */'ListExpression', 'MemberExpression', 'ModuleExpression', 'NotExpression',
    'NullLiteralExpression', 'NumericLiteralExpression', 'ParenthesisedExpression', 'QuantifiedExpression',
    'RecordExpression', 'ReferenceExpression', 'SelectionExpression', 'SequenceExpression',
    'StringLiteralExpression', 'UnresolvedReferenceExpression',
] as const;
export type ExpressionKind = (typeof ExpressionKind)[any];
export const NodeKind = ['Module', 'Program', ...BindingKind, ...ExpressionKind] as const;
export type NodeKind = (typeof NodeKind)[any];
