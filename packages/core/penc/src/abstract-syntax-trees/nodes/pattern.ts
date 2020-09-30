/** Union of all node types that bind names to expressions. */
export type Pattern =
    | ModulePattern
    | NamePattern
;


export interface ModulePattern {
    readonly kind: 'ModulePattern';
    readonly names: ReadonlyArray<{
        readonly name: string;
        readonly alias?: string;
    }>;
}


export interface NamePattern {
    readonly kind: 'NamePattern';
    readonly name: string;
}
