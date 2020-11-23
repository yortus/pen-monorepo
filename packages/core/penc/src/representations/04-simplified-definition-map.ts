import {allNodeKinds, Definition} from '../abstract-syntax-trees';


// TODO: doc difference between this 'simplified' form and the plain defn map...
/** A PEN program expressed as a map from definition IDs to `Definition` AST nodes. */
export interface SimplifiedDefinitionMap {
    readonly definitionsById: Record<string, Definition>;
    readonly startDefinitionId: string;
}


/** List of node kinds that may be present in a DefinitionMap program representation. */
export const simplifiedDefinitionMapKinds = allNodeKinds.without(
    'Binding',
    'Identifier',
    'Module',
    'MemberExpression',
    'ModuleExpression',
    'ModulePattern',
    'SourceFile',
);
