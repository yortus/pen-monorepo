import {Node, Program} from '../../ast-nodes';
import {makeNodeVisitor} from '../../utils';
import {Metadata} from '../04-resolve-symbol-references';


// TODO: doc...
export function resolveConstantValues(program: Program<Metadata>) {
    const {symbolTable} = program.meta;
    let visitNode = makeNodeVisitor<Node<Metadata>, {value: unknown} | void>();
    visitNode(program, rec => ({
        // ApplicationExpression: return rec(n.lambda), rec(n.argument), undefined;
        Binding: ({pattern, value}) => {
            // TODO: temp testing...
            if (pattern.kind === 'VariablePattern') {
                let symbol = symbolTable.lookup(pattern.meta.symbolId);
                symbol.constant = rec(value) || undefined;
            }
        },
        // BindingLookupExpression: return rec(n.module), undefined;
        BooleanLiteralExpression: expr => ({value: expr.value}),
        // FieldExpression: return rec(n.name), rec(n.value), undefined;
        // ImportExpression: return;
        // //////////////////////////// LambdaExpression: TODO: ...
        // ListExpression: return n.elements.forEach(rec), undefined;
        // Module: return n.bindings.forEach(rec), undefined;
        // ModuleExpression: return rec(n.module), undefined;
        // ModulePattern: return n.names.forEach(rec), undefined;
        // ModulePatternName: return;
        NullLiteralExpression: () => ({value: null}),
        NumericLiteralExpression: expr => ({value: expr.value}),
        // ParenthesisedExpression: return rec(n.expression), undefined;
        // PenSourceFile: return rec(n.module), undefined;
        // Program: return mapMap(n.sourceFiles, rec), undefined;
        // RecordExpression: return n.fields.forEach(rec), undefined;
        // ReferenceExpression: return;
        // SelectionExpression: return n.expressions.forEach(rec), undefined;
        // SequenceExpression: return n.expressions.forEach(rec), undefined;
        // StaticField: return rec(n.value), undefined;
        StringLiteralExpression: expr => ({value: expr.value}),
        // VariablePattern: return;
    }));

    // TODO: temp testing...
    let result = program;



    // All done.
    return result;
}
