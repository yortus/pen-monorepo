import {ModuleMap, NodeKind} from './nodes';


export interface Program<KS extends NodeKind = any> {
    readonly kind: 'Program';
    readonly sourceFiles: ModuleMap<KS>;
}
