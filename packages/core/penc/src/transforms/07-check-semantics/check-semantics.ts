import {Node, Program} from '../../ast-nodes';
import {makeNodeVisitor} from '../../utils';
import {Metadata} from '../06-dealias-symbols';


// TODO: doc...
export function checkSemantics(program: Program<Metadata>) {
    let visitNode = makeNodeVisitor<Node<Metadata>>();
    visitNode(program, rec => ({
        RecordExpression: ({fields}) => {
            fields.reduce(
                (names, field) => {
                    // Ensure Record field names are unique within the record definition
                    if (names.has(field.name)) throw new Error(`Duplicate field name '${field.name}'`);
                    rec(field);
                    return names.add(field.name);
                },
                new Set<string>()
            );
        },
    }));
}
