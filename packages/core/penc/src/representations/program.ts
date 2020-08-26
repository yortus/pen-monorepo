import {AbsPath} from '../utils';
import {ModuleMap} from './nodes';
import {NodeKind} from './node-kind';


export interface Program<KS extends NodeKind = NodeKind> {
    readonly kind: 'Program';
    readonly sourceFiles: ModuleMap<KS>;
    readonly mainPath: AbsPath;
    readonly startGlobalName?: string;
}
