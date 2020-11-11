import {createNodeKinds} from './utils';


/** Array of all node kinds which are patterns. */
export const patternNodeKinds = createNodeKinds(
    'NamePattern',
    'ModulePattern',
);


/** Array of all node kinds which are expressions. */
export const expressionNodeKinds = createNodeKinds(
    'ApplicationExpression',
    'BooleanLiteral',
    'ExtensionExpression',
    'FieldExpression',
    'ImportExpression',
    // 'LambdaExpression',
    'ListExpression',
    'MemberExpression',
    'ModuleExpression',
    'NameExpression',
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
