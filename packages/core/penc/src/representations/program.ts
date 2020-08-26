import {AbsPath} from '../utils';
import {ModuleMap, NodeKind} from './nodes';


export interface Program<KS extends NodeKind = any> {
    readonly kind: 'Program';
    readonly sourceFiles: ModuleMap<KS>;
    readonly mainPath: AbsPath;
    readonly startGlobalName?: string;
}
