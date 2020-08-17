import {NodeKind} from '../../ast-nodes';
import {AbsPath} from '../../utils';
import {Module} from './module';


export interface Program<KS extends NodeKind = NodeKind> {
    readonly kind: 'Program';
    readonly sourceFiles: ReadonlyMap<AbsPath, Module<KS>>;
    readonly mainPath: AbsPath;
    readonly startSymbolId?: string;
}
