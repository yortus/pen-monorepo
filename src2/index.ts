import {SymbolDefinitions} from './node-metadata';
import {Node} from './node-types';


function foo(node: Node<SymbolDefinitions>) {
    if (node.kind === 'Program') {
        node.meta.scope;
    }
    else if (node.kind === 'ModuleExpression') {
        node.meta;
    }
}
