import type {AbsPath} from '../../utils';
import type {Module} from './module';
import type {NodeKind} from './node-kind';


export interface AbstractSyntaxTree<KS extends NodeKind = NodeKind> {
    readonly kind: 'AbstractSyntaxTree';
    readonly modulesByAbsPath: ReadonlyMap<AbsPath, Module<KS>>;
}
