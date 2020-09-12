import {createNodeKinds} from './utils';


/** Array of all node kinds which are bindings. */
export const bindingNodeKinds = createNodeKinds(
    'GlobalBinding',
    'LocalBinding',
    'LocalMultiBinding',
);


/** Array of all node kinds which are expressions. */
export const expressionNodeKinds = createNodeKinds(
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


/** Array of all node kinds. */
export const allNodeKinds = createNodeKinds(
    'AbstractSyntaxTree',
    'Module',
    ...bindingNodeKinds,
    ...expressionNodeKinds,
);
