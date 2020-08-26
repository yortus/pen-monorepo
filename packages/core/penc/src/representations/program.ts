import {ModuleMap} from '../ast';
import {NodeKind} from '../ast-nodes';
import {AbsPath} from '../utils';


export interface Program<KS extends NodeKind = NodeKind> {
    readonly kind: 'Program';
    readonly sourceFiles: ModuleMap<KS>;
    readonly mainPath: AbsPath;
    readonly startGlobalName?: string;
}
