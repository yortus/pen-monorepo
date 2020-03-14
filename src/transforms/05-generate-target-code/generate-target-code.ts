import * as AstNodes from '../../ast-nodes';
import {Scope} from '../../scope';
import {SymbolTable} from '../../symbol-table';
import {makeNodeVisitor} from '../../utils';
import {SymbolDefinitions} from '../03-create-symbol-definitions';
import {SymbolReferences} from '../04-resolve-symbol-references';
import {Emitter, makeEmitter} from './emitter';


type Program = AstNodes.Program<SymbolDefinitions & SymbolReferences>;
type Module = AstNodes.Module<SymbolDefinitions & SymbolReferences>;
type Expression = AstNodes.Expression<SymbolDefinitions & SymbolReferences>;


// TODO: doc...
export function generateTargetCode(program: Program) {
    return emitProgram(program);
}


function emitProgram(program: Program) {
    const emit = makeEmitter();

    // TODO: header stuff...
    // TODO: every source file import the PEN standard library
    // TODO: how to ensure it can be loaded? Use rel path and copy file there?
    // emit.down(1).text(`import * as std from "penlib;"`);
    // emit.down(2);
    emit.down(1).text(`let std;`);

    // Emit declarations for all symbols before any are defined.
    emitSymbolDeclarations(emit, program.meta.rootScope);

    // Emit definitions for all symbols.
    emitSymbolDefinitions(emit, program);

    // All done.
    return emit.toString();
}


function emitSymbolDeclarations(emit: Emitter, rootScope: Scope) {
    visitScope(rootScope);

    function visitScope(scope: Scope) {
        if (scope.parent) { // TODO: skip the root scope for now... revise?
            emit.down(2).text(`const 𝕊${scope.id} = {`).indent();
            emit.down(1).text(`kind: 'module',`);
            emit.down(1).text(`bindings: {`).indent();
            for (let symbol of scope.symbols.values()) {
                emit.down(1).text(`${symbol.name}: {},`);
            }
            emit.dedent().down(1).text(`},`);
            emit.dedent().down(1).text(`};`);
        }
        scope.children.forEach(visitScope);
    }
}


function emitSymbolDefinitions(emit: Emitter, program: Program) {
    const {symbolTable} = program.meta;
    let visitNode = makeNodeVisitor<AstNodes.Node<SymbolDefinitions & SymbolReferences>>();
    visitNode(program, rec => ({
        SourceFile: sf => {
            emit.down(2).text(`// -------------------- ${sf.path} --------------------`);
            rec(sf.module);
        },
        Module: module => {
            emitModule(emit, module, symbolTable);
            module.bindings.forEach(rec);
        },
    }));
}


function emitModule(emit: Emitter, module: Module, symbolTable: SymbolTable) {
    for (let {pattern, value} of module.bindings) {
        if (pattern.kind === 'ModulePattern' && pattern.names.length > 0) {
            emit.down(2).text('{').indent();
            emit.down(1).text(`let rhs = `);
            emitExpression(emit, value, symbolTable);
            emit.text(';');
            for (let {name, alias, meta: {symbolId}} of pattern.names) {
                let {scope} = symbolTable.lookup(symbolId);
                emit.down(1).text(`Object.assign(`);
                emit.text(`𝕊${scope.id}.bindings.${alias || name}, `);
                emit.text(`std.bindingLookup(rhs, '${name}'));`);
            }
            emit.dedent().down(1).text('}');
        }
        else if (pattern.kind === 'VariablePattern') {
            let {name, scope} = symbolTable.lookup(pattern.meta.symbolId);
            emit.down(2).text(`Object.assign(`).indent();
            emit.down(1).text(`𝕊${scope.id}.bindings.${name},`).down(1);
            emitExpression(emit, value, symbolTable);
            emit.dedent().down(1).text(`);`);
        }
    }
}


function emitExpression(emit: Emitter, expr: Expression, symbolTable: SymbolTable) {
    switch (expr.kind) {
        case 'ApplicationExpression':
            emitCall(emit, expr.function, [expr.argument], symbolTable);
            return;
        case 'BindingLookupExpression':
            emit.text('std.bindingLookup(').indent().down(1);
            emitExpression(emit, expr.module, symbolTable);
            emit.text(',').down(1).text(`'${expr.bindingName}'`);
            emit.dedent().down(1).text(`)`);
            return;
        case 'CharacterExpression':
            break; // TODO...
        // case 'FunctionExpression':
        //     break; // TODO...
        case 'ImportExpression':
            // TODO: treat as reference
            emit.text(`𝕊${expr.meta.scope.id}`);
            return;
        case 'LabelExpression':
            break; // TODO...
        case 'ListExpression':
            break; // TODO...
        case 'ModuleExpression':
            // TODO: treat as reference
            emit.text(`𝕊${expr.module.meta.scope.id}`);
            return;
        case 'ParenthesisedExpression':
            // TODO: emit extra parens?
            emitExpression(emit, expr.expression, symbolTable);
            return;
        case 'RecordExpression':
            emit.text('std.record([').indent();
            for (let field of expr.fields) {
                let hasComputedName = field.kind === 'DynamicField';
                emit.down(1).text('{').indent();
                emit.down(1).text(`hasComputedName: ${hasComputedName},`);
                emit.down(1).text(`name: `);
                if (hasComputedName) {
                    emitExpression(emit, field.name as any, symbolTable);
                }
                else {
                    emit.text(`'${field.name}'`);
                }
                emit.text(',').down(1).text(`value: `);
                emitExpression(emit, field.value, symbolTable);
                emit.text(',');
                emit.dedent().down(1).text('},');
            }
            emit.dedent().down(1).text('])');
            return;
        case 'ReferenceExpression':
            let ref = symbolTable.lookup(expr.meta.symbolId);
            emit.text(`std.reference(𝕊${ref.scope.id}, '${ref.name}')`);
            return;
        case 'SelectionExpression':
            emitCall(emit, 'std.selection', expr.expressions, symbolTable);
            return;
        case 'SequenceExpression':
            emitCall(emit, 'std.sequence', expr.expressions, symbolTable);
            return;
        case 'StringExpression':
            emit.text(JSON.stringify(expr.value)); // TODO: needs work...
            return;
        default:
            throw new Error('Internal Error'); // TODO...
    }
    emit.text(`std.NOT_IMPLEMENTED('${expr.kind}')`);
}


// TODO: temp testing...
function emitCall(emit: Emitter, fn: string | Expression, args: ReadonlyArray<Expression>, symbolTable: SymbolTable) {
    if (typeof fn === 'string') {
        emit.text(fn);
    }
    else {
        emitExpression(emit, fn, symbolTable);
    }
    emit.text(`(`).indent();
    args.forEach((arg, i) => {
        emit.down(1);
        emitExpression(emit, arg, symbolTable);
        if (i < args.length - 1) emit.text(',');
    });
    emit.dedent().down(1).text(`)`);
}
