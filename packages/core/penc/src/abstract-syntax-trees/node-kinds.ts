import {createNodeKinds} from './utils';


/** Array of all node kinds which are patterns. */
export const patternNodeKinds = createNodeKinds(
    'NamePattern',
    'ModulePattern',
);


/** Array of all node kinds which are expressions. */
export const expressionNodeKinds = createNodeKinds(
    'ApplicationExpression',
    'BooleanLiteralExpression',
    'ExtensionExpression',
    'FieldExpression',
    'ImportExpression',
    // 'LambdaExpression',
    'ListExpression',
    'MemberExpression',
    'ModuleExpression',
    'NameExpression',
    'NotExpression',
    'NullLiteralExpression',
    'NumericLiteralExpression',
    'ParenthesisedExpression',
    'QuantifiedExpression',
    'RecordExpression',
    'ReferenceExpression',
    'SelectionExpression',
    'SequenceExpression',
    'StringLiteralExpression',
);


/** Array of all node kinds. */
export const allNodeKinds = createNodeKinds(
    'Binding',
    'Definition',
    'Module',
    ...patternNodeKinds,
    ...expressionNodeKinds,
);
