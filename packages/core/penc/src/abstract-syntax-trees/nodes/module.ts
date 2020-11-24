import type {Binding} from './binding';


/** An AST node type representing a PEN module. */
export interface Module {
    readonly kind: 'Module';
    readonly moduleId: string; // TODO: doc: 'file://abs/path' for file modules, otherwise 'internal://123' for module exprs
    readonly parentModuleId?: string; // lexically surrounding module. Only defined for module expressions.
    readonly bindings: ReadonlyArray<Binding>;
}


// TODO: jsdoc...
// TODO: what about exported?
export interface ModuleStub {
    readonly kind: 'ModuleStub';
    readonly moduleId: string;
    readonly bindingDefinitionIds: Record<string, string>;
}
