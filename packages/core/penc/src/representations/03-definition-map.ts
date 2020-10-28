import {allNodeKinds, Definition} from '../abstract-syntax-trees';


/** A PEN program expressed as a map from definition IDs to `Definition` AST nodes. */
export interface DefinitionMap {
    readonly DefinitionsById: ReadonlyMap<string, Definition>;
    readonly startDefinitionId: string;
}


/** List of node kinds that may be present in a DefinitionMap AST. */
export const definitionMapKinds = allNodeKinds.without(
    'Binding',
    'Module',
    'ModuleExpression',
    'ModulePattern',
    'NameExpression',
    'NamePattern',
);
