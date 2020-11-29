// TODO: remove...
export interface ModuleStub {
    readonly kind: 'ModuleStub';
    readonly moduleId: string;
    readonly bindingDefinitionIds: Record<string, string>;
}
