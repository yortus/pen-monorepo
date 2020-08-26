import {NodeKind} from './nodes';


const AstBrand = Symbol();
type AstBrand = typeof AstBrand;


export interface Ast<NodeKinds extends NodeKind = any> {
    readonly [AstBrand]?: NodeKinds; // TODO: clean up?
}
