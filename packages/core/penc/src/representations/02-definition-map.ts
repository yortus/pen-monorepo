import {allNodeKinds, Expression, Module} from '../ast-nodes';


// TODO: revise old comments here
// TODO: doc that Modules/Bindings are still present in this form and why, and that Identifier nodes are present only as
//   lhs of Binding nodes inside modules
/** A PEN program expressed as a map from definition IDs to `Definition` AST nodes. */
export type DefinitionMap = Omit<Module, 'kind'> & {readonly bindings: {start: Expression}};


/** List of node kinds that may be present in a DefinitionMap program representation. */
export const definitionMapNodeKinds = allNodeKinds.without(
    'Binding',
    'BindingList',
    'ImportExpression',
    'MemberExpression',
    'ModulePattern',
    'ParenthesisedExpression',
);
