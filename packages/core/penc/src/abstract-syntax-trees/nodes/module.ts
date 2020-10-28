import type {Binding} from './binding';


/** An AST node type representing a PEN module. */
export interface Module {
    readonly kind: 'Module';
    readonly id: string; // TODO: doc: 'file://abs/path' for file modules, otherwise 'internal://123' for module exprs
    readonly bindings: ReadonlyArray<Binding>;
}
