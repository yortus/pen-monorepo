import {Node, Program} from '../../ast-nodes';
import {assert, makeNodeVisitor} from '../../utils';
import {Metadata} from './metadata';


// TODO: doc...
export function resolveConstantValues(program: Program<Metadata>) {
    const {symbolTable} = program.meta;
    let visitNode = makeNodeVisitor<Node<Metadata>, {value: unknown} | void>();
    visitNode(program, rec => ({
        // ApplicationExpression: return rec(n.lambda), rec(n.argument), undefined;
        SimpleBinding: ({value, meta}) => {
            // TODO: temp testing...
            let symbol = symbolTable.getSymbolById(meta.symbolId);
            assert(symbol.kind === 'NameSymbol');
            symbol.constant = rec(value) || undefined;
        },
        // MemberExpression: return rec(n.module), undefined;
        BooleanLiteralExpression: expr => ({value: expr.value}),
        // FieldExpression: return rec(n.name), rec(n.value), undefined;
        // ImportExpression: return;
        // //////////////////////////// LambdaExpression: TODO: ...
        // ListExpression: return n.elements.forEach(rec), undefined;
        // Module: return n.bindings.forEach(rec), undefined;
        // ModuleExpression: return rec(n.module), undefined;
        NullLiteralExpression: () => ({value: null}),
        NumericLiteralExpression: expr => ({value: expr.value}),
        // PenSourceFile: return rec(n.module), undefined;
        // Program: return mapMap(n.sourceFiles, rec), undefined;
        // RecordExpression: return n.fields.forEach(rec), undefined;
        // ReferenceExpression: return;
        // SelectionExpression: return n.expressions.forEach(rec), undefined;
        // SequenceExpression: return n.expressions.forEach(rec), undefined;
        StringLiteralExpression: expr => ({value: expr.value}),
    }));

    // TODO: temp testing...
    let result = program;



    // All done.
    return result;
}
