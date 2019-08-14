import {Node} from './nodes';




// Array of strings corresponding to every possible node kind.
export const nodeKinds = getNodeKinds();




// Helper function that ensures the runtime and type-system lists of node kinds are perfectly matched.
// A compile-time error is generated for any missing, excess, or misspelled node kinds.
function getNodeKinds() {
    let nodeKindMap: {[K in Node['kind']]: unknown} = {
        Application: 0,
        Block: 0,
        CharacterRange: 0,
        Combinator: 0,
        Definition: 0,
        ImportNames: 0,
        ImportNamespace: 0,
        ListLiteral: 0,
        ModuleDeclaration: 0,
        ModuleDefinition: 0,
        Parenthetical: 0,
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
