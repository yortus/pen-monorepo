import {createNodeKinds} from './utils';


/** Array of all node kinds which are patterns. */
export const patternNodeKinds = createNodeKinds(
    'ModulePattern',
);


/** Array of all node kinds which are expressions. */
export const expressionNodeKinds = createNodeKinds(
    'ApplicationExpression',
    'BooleanLiteral',
    'FieldExpression',
    'Identifier',
    'ImportExpression',
    'Intrinsic',
    // 'LambdaExpression',
    'ListExpression',
    'MemberExpression',
    'Module',
    'ModuleExpression',
    'NotExpression',
    'NullLiteral',
    'NumericLiteral',
    'ParenthesisedExpression',
    'QuantifiedExpression',
    'RecordExpression',
    'Reference',
    'SelectionExpression',
    'SequenceExpression',
    'StringLiteral',
);


/** Array of all node kinds. */
export const allNodeKinds = createNodeKinds(
    'Binding',
    'Definition',
    'ModuleStub',
    'SourceFile',
    ...patternNodeKinds,
    ...expressionNodeKinds,
);
