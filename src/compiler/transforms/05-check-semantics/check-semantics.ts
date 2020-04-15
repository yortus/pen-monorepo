import {Node, Program} from '../../ast-nodes';
import {makeNodeVisitor} from '../../utils';
import {SymbolDefinitions} from '../03-create-symbol-definitions';
import {SymbolReferences} from '../04-resolve-symbol-references';


// TODO: doc...
export function checkSemantics(program: Program<SymbolDefinitions & SymbolReferences>) {
    let visitNode = makeNodeVisitor<Node<SymbolDefinitions & SymbolReferences>>();
    visitNode(program, rec => ({
        RecordExpression: ({fields}) => {
            fields.reduce(
                (names, field) => {
                    if (names.has(field.name)) throw new Error(`Duplicate field name '${field.name}'`);
                    rec(field);
                    return names.add(field.name);
                },
                new Set<string>()
            );
        },
    }));
}
