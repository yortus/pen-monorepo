import {AbstractSyntaxTree} from './nodes';


// TODO: doc...
export type ExtractNodeKinds<T extends AbstractSyntaxTree> = T extends AbstractSyntaxTree<infer NodeKinds> ? NodeKinds : never;
