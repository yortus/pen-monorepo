import {allNodeKinds, Definition} from '../abstract-syntax-trees';


// TODO: jsdoc...
export interface YoloProgram {
    readonly kind: 'YoloProgram';
    readonly DefinitionsById: ReadonlyMap<string, Definition>;

    readonly startDefinitionId: string;
}


// TODO: jsdoc...
export const yoloNodeKinds = allNodeKinds.without(
    'Binding',
    'Module',
    'ModulePattern',
    'ModuleExpression',
    'NameExpression',
    'NamePattern',
);
