import {NodeKind} from './nodes';


const Brand = Symbol();
type Brand = typeof Brand;


export interface Program<KS extends NodeKind = any> {
    readonly [Brand]?: KS; // TODO: clean up?
}
