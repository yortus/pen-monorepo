import {Node, Program} from '../../ast-nodes';
import {isExtension, makeNodeVisitor, mapMap} from '../../utils';
import {Metadata} from './metadata';


// TODO: doc...
export function checkSemantics(program: Program<Metadata>) {
    let visitNode = makeNodeVisitor<Node<Metadata>>();
    visitNode(program, rec => ({
        RecordExpression: ({fields}) => {
            // Ensure Record field names are unique within the record definition
            let names = new Set<string>();
            for (let field of fields) {
                if (names.has(field.name)) throw new Error(`Duplicate field name '${field.name}'`);
                names.add(field.name);
                rec(field.value);
            }
        },

        Program: prg => {
            // Ensure the 'main' source file is a pen source file that has a 'start' rule.
            let main = prg.sourceFiles.get(program.mainPath)!;
            if (isExtension(main.path)) throw new Error(`Main module must be a pen module, not an extension.`);
            let startSymbolId = main.module.meta.scope.sourceNames.get('start')?.id;
            if (startSymbolId === undefined) throw new Error(`Main module must define a 'start' rule.`);
            mapMap(prg.sourceFiles, rec);
        },
    }));
}
