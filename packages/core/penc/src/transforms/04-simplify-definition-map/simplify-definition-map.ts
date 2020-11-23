import {DefinitionMap, SimplifiedDefinitionMap} from '../../representations';
import {assert} from '../../utils';
import {createDereferencer} from './create-dereferencer';
import {createNodeHasher} from './create-node-hasher';


// TODO: doc... after this transform, the following node kinds will no longer be present anywhere in the AST:
// - LocalMultiBinding
export function simplifyDefinitionMap({definitionsById}: DefinitionMap): SimplifiedDefinitionMap {

    const deref = createDereferencer(definitionsById);
    const hashNode = createNodeHasher(deref);

    // TODO: make a new list of definitions, such that:
    // - each definition has a shallow expression - no nested exprs
    // - common expressions appear only once
    // const definitionsByHash = new Map<string, Definition>();
    // for (const def of definitions) {
    //     // TODO: temp testing...
    //     const node = def.value;
    //     assert(node.kind !== 'Identifier');
    //     assert(node.kind !== 'ModuleExpression');
    //     const hash = hashNode(node);

    // }

    const defnHashes = Object.values(definitionsById).reduce((obj, def) => {
        // TODO: temp testing...
        const node = def.value;
        assert(node.kind !== 'Identifier');
        assert(node.kind !== 'ModuleExpression');
        const hash = hashNode(node);
        obj[hash] ??= [];
        obj[hash].push(def.localName);
        return obj;
    }, {} as Record<string, string[]>);
    [] = [defnHashes];

    // TODO: in debug mode, ensure only allowed node kinds are present in the representation
    //traverseNode(null!, n => assert(definitionMapKinds.matches(n)));

    if (1 !== 1 + 1) return null!;

    return null!; /*{
        definitions,
        startSomething: '????',
    };*/
}
