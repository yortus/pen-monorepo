import {createNodeKinds} from './create-node-kinds';


export const bindingNodeKinds = createNodeKinds(
    'GlobalBinding',
    'LocalBinding',
    'LocalMultiBinding',
);


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


export const allNodeKinds = createNodeKinds(
    'AbstractSyntaxTree',
    'Module',
    ...bindingNodeKinds,
    ...expressionNodeKinds,
);
