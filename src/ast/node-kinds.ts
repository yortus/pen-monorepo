import {Node} from './node-types';




// TODO: jsdoc...
export const nodeKinds = getNodeKinds();




function getNodeKinds() {
    let nodeKindMap: {[K in Node['kind']]: unknown} = {
        Application: 0,
        Block: 0,
        CharacterRange: 0,
        Combinator: 0,
        Definition: 0,
        ForeignModule: 0,
        ImportDeclaration: 0,
        ListLiteral: 0,
        Parenthetical: 0,
        PenModule: 0,
        RecordField: 0,
        RecordLiteral: 0,
        Reference: 0,
        Selection: 0,
        Sequence: 0,
        StringLiteral: 0,
        VoidLiteral: 0,
    };
    return Object.keys(nodeKindMap) as Array<Node['kind']>;
}
