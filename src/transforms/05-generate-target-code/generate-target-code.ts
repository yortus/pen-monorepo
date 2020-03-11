import * as AstNodes from '../../ast-nodes';
import {Scope} from '../../scope';
import {Symbol, SymbolTable} from '../../symbol-table';
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
    emit.down(1).text(`import * as std from "penlib;"`);
    emit.down(2);

    // Emit declarations for all symbols before any are defined.
    emitSymbolDeclarations(emit, program.meta.rootScope);

    // Emit definitions for all symbols.
    emitSymbolDefinitions(emit, program);

    // All done.
    return emit.toString();
}


function emitSymbolDeclarations(emit: Emitter, rootScope: Scope) {
    emit.down(1).text(`const 𝕊${rootScope.id} = {`).indent();
    rootScope.children.forEach(visitScope);
    emit.dedent().down(1).text(`};`);
    function visitScope(scope: Scope) {
        emit.down(1).text(`𝕊${scope.id}: {`).indent();
        for (let symbol of scope.symbols.values()) {
            emit.down(1).text(`${symbol.name}: {},`);
        }
        scope.children.forEach(visitScope);
        emit.dedent().down(1).text(`},`);
    }
}


function emitSymbolDefinitions(emit: Emitter, program: Program) {
    const {symbolTable} = program.meta;
    let visitNode = makeNodeVisitor<AstNodes.Node<SymbolDefinitions & SymbolReferences>>();
    visitNode(program, rec => ({
        Module: module => {
            emitModule(emit, module, symbolTable);
            module.bindings.forEach(rec);
        },
    }));
}


function emitModule(emit: Emitter, module: Module, symbolTable: SymbolTable) {
    for (let {pattern, value} of module.bindings) {
        if (pattern.kind === 'ModulePattern') {
            // assert(value.kind === 'ImportExpression'); // TODO: relax this restriction later... Need different emit...
            // TODO: emit...
            emit.down(2).text('// TODO: emit for ModulePattern...');
        }
        else /* pattern.kind === 'VariablePattern */{
            // TODO: ensure no clashes with ES names, eg Object, String, etc
            emit.down(1).text(`Object.assign(`).indent();
            emit.down(1);
            emitSymbolReference(emit, symbolTable.lookup(pattern.meta.symbolId));
            emit.text(',').down(1);
            emitExpression(emit, value, symbolTable);
            emit.dedent().down(1).text(`);`);
        }
    }
}


function emitSymbolReference(emit: Emitter, symbol: Symbol) {
    let {name, scope} = symbol;
    while (true) {
        name = `𝕊${scope.id}.${name}`;
        if (!scope.parent) break;
        scope = scope.parent;
    }
    emit.text(name);
}


function emitExpression(emit: Emitter, expr: Expression, symbolTable: SymbolTable) {
    switch (expr.kind) {
        case 'ApplicationExpression':
            emitCall(emit, expr.function, [expr.argument], symbolTable);
            return;
        case 'BindingLookupExpression':
            emit.text('(');
            emitExpression(emit, expr.module, symbolTable);
            emit.text(`).${expr.bindingName}`);
            return;
        case 'CharacterExpression':
            break; // TODO...
        // case 'FunctionExpression':
        //     break; // TODO...
        case 'ImportExpression':
            break; // TODO...
        case 'LabelExpression':
            break; // TODO...
        case 'ListExpression':
            break; // TODO...
        case 'ModuleExpression':
            // TODO: treat as reference
            let {scope} = expr.module.meta;
            let name = `𝕊${scope.id}`;
            while (scope.parent) {
                scope = scope.parent;
                name = `𝕊${scope.id}.${name}`;
            }
            emit.text(name);
            return;
        case 'ParenthesisedExpression':
            // TODO: emit extra parens?
            emitExpression(emit, expr.expression, symbolTable);
            return;
        case 'RecordExpression':
            break; // TODO...
        case 'ReferenceExpression':
            emitSymbolReference(emit, symbolTable.lookup(expr.meta.symbolId));
            return;
        case 'SelectionExpression':
            emitCall(emit, 'std.selection', expr.expressions, symbolTable);
            return;
        case 'SequenceExpression':
            emitCall(emit, 'std.sequence', expr.expressions, symbolTable);
            return;
        case 'StringExpression':
            emit.text(JSON.stringify(expr.value));
            return;
        default:
            throw new Error('Internal Error'); // TODO...
    }
    emit.text(`<NotImplemented:${expr.kind}>`);
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
    args.forEach((arg, _i) => {
        emit.down(1);
        emitExpression(emit, arg, symbolTable);
        emit.text(',');
    });
    emit.dedent().down(1).text(`)`);
}
