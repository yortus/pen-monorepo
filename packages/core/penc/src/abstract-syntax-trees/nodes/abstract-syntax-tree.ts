import {AbsPath} from '../../utils';
import {Module} from './module';
import {NodeKind} from './node-kind';


export interface AbstractSyntaxTree<KS extends NodeKind = any> {
    readonly kind: 'AbstractSyntaxTree';
    readonly modulesByAbsPath: ReadonlyMap<AbsPath, Module<KS>>;
}
