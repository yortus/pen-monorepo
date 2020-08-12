import {makeNodeVisitor} from '../../utils';
import {ResolvedNodes, ResolvedProgram} from '../asts';


// TODO: doc...
export function checkSemantics(program: ResolvedProgram) {
    let visitNode = makeNodeVisitor<ResolvedNodes>();
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
    }));
}
