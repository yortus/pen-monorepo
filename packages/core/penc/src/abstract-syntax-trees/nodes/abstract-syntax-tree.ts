import type {AbsPath} from '../../utils';
import type {NodeKind} from '../node-kind';
import type {Module} from './module';


export interface AbstractSyntaxTree<KS extends NodeKind = NodeKind> {
    readonly kind: 'AbstractSyntaxTree';
    readonly modulesByAbsPath: ReadonlyMap<AbsPath, Module<KS>>;
}
