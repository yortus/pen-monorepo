import * as AstNodes from '../../ast-nodes';
import {Scope} from '../../scope';
import {SymbolTable} from '../../symbol-table';
import {makeNodeVisitor} from '../../utils';
import {SymbolDefinitions} from '../03-create-symbol-definitions';
import {SymbolReferences} from '../04-resolve-symbol-references';
import {emitInitRuntimeSystem} from './emit-init-runtime-system';
import {emitInitStandardLibrary} from './emit-init-standard-library';
import {Emitter, makeEmitter} from './emitter';


type Program = AstNodes.Program<SymbolDefinitions & SymbolReferences>;
type Expression = AstNodes.Expression<SymbolDefinitions & SymbolReferences>;


// TODO: doc...
export function generateTargetCode(program: Program) {
    return emitProgram(program);
}


function emitProgram(program: Program) {
    const emit = makeEmitter();

    // TODO: Emit main exports...
    emitMainExports(emit, program);

    // TODO: Emit header stuff...
    emit.down(2).text(`const sys = initRuntimeSystem();`);
    emit.down(1).text(`const std = initStandardLibrary();`);

    // Emit declarations for all symbols before any are defined.
    emitSymbolDeclarations(emit, program.meta.rootScope);

    // TODO: Emit definitions for all symbols (ie module bindings where lhs is a VariablePattern)
    emitSymbolDefinitions(emit, program);

    // Emit code for the runtime system.
    emit.down(2).text(`// -------------------- RUNTIME SYSTEM --------------------`);
    emitInitRuntimeSystem(emit);

    // Emit code for the standard library.
    emit.down(2).text(`// -------------------- STANDARD LIBRARY --------------------`);
    emitInitStandardLibrary(emit);

    // All done.
    return emit.toString();
}


function emitMainExports(emit: Emitter, program: Program) {
    let mainModule = program.sourceFiles.get(program.mainPath)!.module;
    if (!mainModule.meta.scope.symbols.has('start')) throw new Error(`Main module must define a 'start' rule.`);
    let lines = `
        module.exports = {parse, unparse};

        function parse(text) {
            let start = 𝕊${mainModule.meta.scope.id}.bindings.start;
            let result = {node: null, posᐟ: 0};
            if (!start.parse(text, 0, result)) throw new Error('parse failed');
            if (result.posᐟ !== text.length) throw new Error('parse didn\\'t consume entire input');
            if (result.node === undefined) throw new Error('parse didn\\'t return a value');
            return result.node;
        }

        function unparse(node) {
            let start = 𝕊${mainModule.meta.scope.id}.bindings.start;
            let result = {text: '', posᐟ: 0};
            if (!start.unparse(node, 0, result)) throw new Error('parse failed');
            if (!sys.isFullyConsumed(node, result.posᐟ)) throw new Error('unparse didn\\'t consume entire input');
            return result.text;
        }
    `.split(/\r\n?|\n/).slice(1, -1);
    let indent = lines[0].length - lines[0].trimLeft().length;
    lines = lines.map(line => line.slice(indent));
    lines.forEach((line, i) => {
        if (i > 0) emit.down(1);
        emit.text(line);
    });
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
            for (let {pattern, value} of module.bindings) {
                if (pattern.kind === 'ModulePattern' && pattern.names.length > 0) {
                    // TODO:
                    // if rhs is a ReferenceExpression that refs a module, or is an ImportExpression, then its an alias
                    // but does that matter for emit here? If not, must prove current emit is always correct/safe,
                    // eg with forward refs
                    emit.down(2).text('{').indent();
                    emit.down(1).text(`let rhs = `);
                    emitExpression(emit, value, symbolTable);
                    emit.text(';');
                    for (let {name, alias, meta: {symbolId}} of pattern.names) {
                        let {scope} = symbolTable.lookup(symbolId);
                        emit.down(1).text(`𝕊${scope.id}.bindings.${alias || name} = `);
                        emit.text(`sys.bindingLookup(rhs, '${name}');`);
                    }
                    emit.dedent().down(1).text('}');
                }
                else if (pattern.kind === 'VariablePattern') {
                    let {name, scope} = symbolTable.lookup(pattern.meta.symbolId);
                    if (value.kind === 'ReferenceExpression' || value.kind === 'ImportExpression') {
                        emit.down(2).text(`𝕊${scope.id}.bindings.${name} = `);
                        emitExpression(emit, value, symbolTable);
                        emit.text(`; // alias`);
                    }
                    else {
                        emit.down(2).text(`Object.assign(`).indent();
                        emit.down(1).text(`𝕊${scope.id}.bindings.${name},`).down(1);
                        emitExpression(emit, value, symbolTable);
                        emit.dedent().down(1).text(`);`);
                    }
                }
            }
            module.bindings.forEach(rec);
        },
    }));
}


function emitExpression(emit: Emitter, expr: Expression, symbolTable: SymbolTable) {
    switch (expr.kind) {
        case 'ApplicationExpression':
            emit.text('sys.apply(').indent().down(1);
            emitExpression(emit, expr.function, symbolTable);
            emit.text(',').down(1);
            emitExpression(emit, expr.argument, symbolTable);
            emit.dedent().down(1).text(`)`);
            return;

        case 'BindingLookupExpression':
            emit.text('sys.bindingLookup(').indent().down(1);
            emitExpression(emit, expr.module, symbolTable);
            emit.text(',').down(1).text(`'${expr.bindingName}'`);
            emit.dedent().down(1).text(`)`);
            return;

        case 'CharacterExpression':
            const charModifier = expr.concrete ? (expr.abstract ? '' : `, 'concrete'`) : `, 'abstract'`;
            emit.text('sys.character(');
            emit.text(JSON.stringify(expr.minValue)).text(', ');
            emit.text(JSON.stringify(expr.maxValue));
            emit.text(`${charModifier})`);
            return;

        // case 'FunctionExpression':
        //     break; // TODO...

        case 'ImportExpression':
            // TODO: temp special-case 'std' handling. Unify these two cases better...
            if (expr.moduleSpecifier === 'std') {
                emit.text(`std`);
                return;
            }
            else {
                emit.text(`𝕊${expr.meta.scope.id}`);
                return;
            }

        case 'ListExpression':
            emit.text('sys.list([').indent();
            for (let element of expr.elements) {
                emit.down(1);
                emitExpression(emit, element, symbolTable);
                emit.text(',');
            }
            emit.dedent().down(1).text('])');
            return;

        case 'ModuleExpression':
            emit.text(`𝕊${expr.module.meta.scope.id}`);
            return;

        case 'ParenthesisedExpression':
            // TODO: emit extra parens?
            emitExpression(emit, expr.expression, symbolTable);
            return;

        case 'RecordExpression':
            emit.text('sys.record([').indent();
            for (let field of expr.fields) {
                let dynamic = field.kind === 'DynamicField';
                emit.down(1).text('{').indent();
                emit.down(1).text(`dynamic: ${dynamic},`);
                emit.down(1).text(`name: `);
                dynamic ? emitExpression(emit, field.name as any, symbolTable) : emit.text(`'${field.name}'`);
                emit.text(',').down(1).text(`value: `);
                emitExpression(emit, field.value, symbolTable);
                emit.text(',');
                emit.dedent().down(1).text('},');
            }
            emit.dedent().down(1).text('])');
            return;

        case 'ReferenceExpression':
            let ref = symbolTable.lookup(expr.meta.symbolId);
            emit.text(`𝕊${ref.scope.id}.bindings.${ref.name}`);
            return;

        case 'SelectionExpression':
            emitCall(emit, 'sys.selection', expr.expressions, symbolTable);
            return;

        case 'SequenceExpression':
            emitCall(emit, 'sys.sequence', expr.expressions, symbolTable);
            return;

        case 'StringExpression':
            const strModifier = expr.concrete ? (expr.abstract ? '' : `, 'concrete'`) : `, 'abstract'`;
            emit.text(`sys.string(${JSON.stringify(expr.value)}${strModifier})`);
            return;

        default:
            throw new Error('Internal Error'); // TODO...
    }
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
