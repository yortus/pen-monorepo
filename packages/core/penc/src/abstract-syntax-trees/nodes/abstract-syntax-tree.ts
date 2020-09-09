import type {AbsPath} from '../../utils';
import type {Module} from './module';


export interface AbstractSyntaxTree {
    readonly kind: 'AbstractSyntaxTree';
    readonly modulesByAbsPath: ReadonlyMap<AbsPath, Module>;
}
