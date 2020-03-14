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
    // emit.down(1).text(`import * as std from "penlib;"`);
    // emit.down(2);
    emit.down(1).text(`let NOT_IMPLEMENTED;`);
    emit.down(1).text(`let reference;`);
    emit.down(1).text(`let bindingLookup;`);
    emit.down(1).text(`let sequence;`);
    emit.down(1).text(`let selection;`);
    emit.down(1).text(`let record;`);

    // Emit declarations for all symbols before any are defined.
    emitSymbolDeclarations(emit, program.meta.rootScope);

    // Emit definitions for all symbols.
    emitSymbolDefinitions(emit, program);

    // All done.
    return emit.toString();
}


function emitSymbolDeclarations(emit: Emitter, rootScope: Scope) {
    // emit.down(1).text(`const 𝕊${rootScope.id} = {`).indent();
    // rootScope.children.forEach(visitScope);
    // emit.dedent().down(1).text(`};`);

    visitScope(rootScope);

    function visitScope(scope: Scope) {
        if (scope.symbols.size > 0) {
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
            emit.down(2).text(`Object.assign(`).indent();
            emit.down(1);
            emitSymbolReference(emit, symbolTable.lookup(pattern.meta.symbolId));
            emit.text(',').down(1);
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
            emit.text('bindingLookup(').indent().down(1);
            emitExpression(emit, expr.module, symbolTable);
            emit.text(',').down(1).text(`'${expr.bindingName}'`);
            emit.dedent().down(1).text(`)`);
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
            emit.text(`𝕊${scope.id}`);
            return;
        case 'ParenthesisedExpression':
            // TODO: emit extra parens?
            emitExpression(emit, expr.expression, symbolTable);
            return;
        case 'RecordExpression':
            emit.text('record([').indent();
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
            emitSymbolReference(emit, symbolTable.lookup(expr.meta.symbolId));
            return;
        case 'SelectionExpression':
            emitCall(emit, 'selection', expr.expressions, symbolTable);
            return;
        case 'SequenceExpression':
            emitCall(emit, 'sequence', expr.expressions, symbolTable);
            return;
        case 'StringExpression':
            emit.text(JSON.stringify(expr.value)); // TODO: needs work...
            return;
        default:
            throw new Error('Internal Error'); // TODO...
    }
    emit.text(`NOT_IMPLEMENTED('${expr.kind}')`);
}


function emitSymbolReference(emit: Emitter, symbol: Symbol) {
    let {name, scope} = symbol;
    emit.text(`reference(𝕊${scope.id}, '${name}')`);
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
