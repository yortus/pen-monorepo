import type {Expression, Identifier} from './expression';
import type {Pattern} from './pattern';


/** An AST node type representing a PEN module. */
export interface Module {
    readonly kind: 'Module';
    readonly moduleId: string;
    readonly parentModuleId?: string; // lexically surrounding module. Only defined for module expressions.
    readonly bindings:
        | ReadonlyArray<{readonly left: Identifier | Pattern, readonly right: Expression}>
        | {readonly [name: string]: Expression};
    
}


// TODO: jsdoc...
export interface ModuleStub {
    readonly kind: 'ModuleStub';
    readonly moduleId: string;
    readonly bindingDefinitionIds: Record<string, string>;
}
