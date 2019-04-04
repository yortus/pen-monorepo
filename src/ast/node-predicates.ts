import {Definition, Node} from './node-types';




export const isDefinition = (n: Node): n is Definition => {
    return n.kind === 'Definition';
};

