// TODO: revisit whether these are needed... If so, add a full set of predicates




import {Definition, Node} from './node-types';




export const isDefinition = (n: Node): n is Definition => {
    return n.kind === 'Definition';
};

