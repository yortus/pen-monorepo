import {traverseAst} from '../../abstract-syntax-trees';
import {ResolvedProgram} from '../../representations';


// TODO: doc...
export function checkSemantics(program: ResolvedProgram) {
    traverseAst(program.sourceFiles, n => {
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
