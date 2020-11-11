import {createNodeKinds} from './utils';


/** Array of all node kinds which are patterns. */
export const patternNodeKinds = createNodeKinds(
    'ModulePattern',
);


/** Array of all node kinds which are expressions. */
export const expressionNodeKinds = createNodeKinds(
    'ApplicationExpression',
    'BooleanLiteral',
    'ExtensionExpression',
    'FieldExpression',
    'Identifier',
    'ImportExpression',
    // 'LambdaExpression',
    'ListExpression',
    'MemberExpression',
    'ModuleExpression',
    'NotExpression',
    'NullLiteral',
    'NumericLiteral',
    'ParenthesisedExpression',
    'QuantifiedExpression',
    'RecordExpression',
    'ReferenceExpression',
    'SelectionExpression',
    'SequenceExpression',
    'StringLiteral',
);


/** Array of all node kinds. */
export const allNodeKinds = createNodeKinds(
    'Binding',
    'Definition',
    'Module',
    ...patternNodeKinds,
    ...expressionNodeKinds,
);
