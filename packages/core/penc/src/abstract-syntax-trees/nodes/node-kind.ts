export type NodeKind =
    // Top-level nodes
    | 'AbstractSyntaxTree'
    | 'Module'
    | BindingKind
    | ExpressionKind
;


export type BindingKind =
    | 'GlobalBinding'
    | 'LocalBinding'
    | 'LocalMultiBinding'
;


export type ExpressionKind =
    | 'ApplicationExpression'
    | 'BooleanLiteralExpression'
    | 'ExtensionExpression'
    | 'FieldExpression'
    | 'GlobalReferenceExpression'
    | 'ImportExpression'
    // | 'LambdaExpression'
    | 'ListExpression'
    | 'LocalReferenceExpression'
    | 'MemberExpression'
    | 'ModuleExpression'
    | 'NotExpression'
    | 'NullLiteralExpression'
    | 'NumericLiteralExpression'
    | 'ParenthesisedExpression'
    | 'QuantifiedExpression'
    | 'RecordExpression'
    | 'SelectionExpression'
    | 'SequenceExpression'
    | 'StringLiteralExpression'
;
