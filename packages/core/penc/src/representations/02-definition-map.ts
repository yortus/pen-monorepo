import {allNodeKinds, Definition} from '../ast-nodes';


// TODO: doc that Modules/Bindings are still present in this form and why, and that Identifier nodes are present only as
//   lhs of Binding nodes inside modules
/** A PEN program expressed as a map from definition IDs to `Definition` AST nodes. */
export interface DefinitionMap {
    readonly definitionsById: Record<string, Definition>; // TODO: should be definitionsByDefinitionId?
    readonly startDefinitionId: string;
}


/** List of node kinds that may be present in a DefinitionMap program representation. */
export const definitionMapNodeKinds = allNodeKinds.without(
    'Binding',
    'BindingList',
    'Identifier',
    'ImportExpression',
    'MemberExpression',
    'ModulePattern',
    'ParenthesisedExpression',
);
