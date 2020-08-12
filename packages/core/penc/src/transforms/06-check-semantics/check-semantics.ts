import {Program} from '../../ast-nodes';
import {traverseAst} from '../../utils';
import {ResolvedNodeKind} from '../asts';


// TODO: doc...
export function checkSemantics(program: Program<ResolvedNodeKind>) {
    traverseAst(program, n => {
        switch (n.kind) {
            case 'RecordExpression': {
                // Ensure Record field names are unique within the record definition
                let names = new Set<string>();
                for (let field of n.fields) {
                    if (names.has(field.name)) throw new Error(`Duplicate field name '${field.name}'`);
                    names.add(field.name);
                }
            }
        }
    });
}
