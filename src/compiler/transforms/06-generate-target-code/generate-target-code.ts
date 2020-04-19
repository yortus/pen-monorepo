import * as AstNodes from '../../ast-nodes';
import {Scope} from '../../scope';
import {SymbolTable} from '../../symbol-table';
import {makeNodeVisitor} from '../../utils';
import {SymbolDefinitions} from '../03-create-symbol-definitions';
import {SymbolReferences} from '../04-resolve-symbol-references';
import {emitInitRuntimeSystem} from './emit-init-runtime-system';
import {emitInitStandardLibrary} from './emit-init-standard-library';
import {emitInitTemporaryExperiments} from './emit-init-temporary-experiments';
import {Emitter, makeEmitter} from './emitter';


type Program = AstNodes.Program<SymbolDefinitions & SymbolReferences>;
type Expression = AstNodes.Expression<SymbolDefinitions & SymbolReferences>;


// TODO: doc...
export function generateTargetCode(program: Program) {
    return emitProgram(program);
}


function emitProgram(program: Program) {
    const emit = makeEmitter();

    // TODO: Emit sys and std...
    emit.text(`const sys = initRuntimeSystem();`);
    emit.down(1).text(`const std = initStandardLibrary();`);
    emit.down(1).text(`const experiments = initTemporaryExperiments();`);

    // Emit declarations for all symbols before any are defined.
    emitSymbolDeclarations(emit, program.meta.rootScope);

    // TODO: Emit aliases...
    emitSymbolAliases(emit, program);

    // TODO: Emit definitions for all symbols (ie module bindings where lhs is a VariablePattern)
    emitSymbolDefinitions(emit, program);

    // TODO: Emit main exports... must come after symbol decls, since it refs the start rule
    emit.down(2).text(`// -------------------- MAIN EXPORTS --------------------`);
    emitMainExports(emit, program);

    // Emit code for the runtime system.
    emit.down(2).text(`// -------------------- RUNTIME SYSTEM --------------------`);
    emitInitRuntimeSystem(emit);

    // Emit code for the standard library.
    emit.down(2).text(`// -------------------- STANDARD LIBRARY --------------------`);
    emitInitStandardLibrary(emit);

    // Emit code for temporary experiments.
    emit.down(2).text(`// -------------------- TEMPORARY EXPERIMENTS --------------------`);
    emitInitTemporaryExperiments(emit);

    // All done.
    return emit.toString();
}


function emitMainExports(emit: Emitter, program: Program) {
    let mainModule = program.sourceFiles.get(program.mainPath)!.module;
    if (!mainModule.meta.scope.symbols.has('start')) throw new Error(`Main module must define a 'start' rule.`);
    emit.down(2).text(`module.exports = sys.createMainExports(𝕊${mainModule.meta.scope.id}.bindings.start);`);
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


function emitSymbolAliases(emit: Emitter, program: Program) {
    const {symbolTable} = program.meta;
    let visitNode = makeNodeVisitor<AstNodes.Node<SymbolDefinitions & SymbolReferences>>();
    emit.down(2).text(`// -------------------- aliases --------------------`);
    visitNode(program, rec => ({
        Module: module => {
            for (let {pattern, value} of module.bindings) {
                if (pattern.kind === 'VariablePattern') {
                    let {name, scope} = symbolTable.lookup(pattern.meta.symbolId);
                    if (value.kind === 'ReferenceExpression' || value.kind === 'ImportExpression') {
                        emit.down(2).text(`𝕊${scope.id}.bindings.${name} = `);
                        emitExpression(emit, value, symbolTable);
                        emit.text(';');
                    }
                }
            }
            module.bindings.forEach(rec);
        },
    }));
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
                        emit.down(1).text(`Object.assign(`).indent();
                        emit.down(1).text(`𝕊${scope.id}.bindings.${alias || name},`);
                        emit.down(1).text(`sys.bindingLookup(rhs, '${name}')`);
                        emit.dedent().down(1).text(`);`);
                    }
                    emit.dedent().down(1).text('}');
                }
                else if (pattern.kind === 'VariablePattern') {
                    let {name, scope} = symbolTable.lookup(pattern.meta.symbolId);
                    if (value.kind !== 'ReferenceExpression' && value.kind !== 'ImportExpression') {
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
            emitExpression(emit, expr.lambda, symbolTable);
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

        case 'BooleanExpression':
            emit.text(`sys.boolean(${expr.value})`);
            return;

        case 'CharacterExpression':
            if (expr.abstract || expr.concrete) emit.text(`sys.${expr.abstract ? 'abstract' : 'concrete'}(`);
            emit.text('sys.character(');
            emit.text(JSON.stringify(expr.minValue)).text(', ').text(JSON.stringify(expr.maxValue)).text(')');
            if (expr.abstract || expr.concrete) emit.text(')');
            return;

        case 'FieldExpression':
            emit.text('sys.field(').indent().down(1);
            emitExpression(emit, expr.name, symbolTable);
            emit.text(',').down(1);
            emitExpression(emit, expr.value, symbolTable);
            emit.dedent().down(1).text(')');
            return;

        case 'ImportExpression':
            // TODO: temp special-case 'std' and 'experiments' handling. Unify these three cases better...
            if (expr.moduleSpecifier === 'std') {
                emit.text(`std`);
                return;
            }
            else if (expr.moduleSpecifier === 'experiments') {
                emit.text(`experiments`);
                return;
            }
            else {
                emit.text(`𝕊${expr.meta.scope.id}`);
                return;
            }

        // case 'LambdaExpression':
        //     break; // TODO...

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

        case 'NullExpression':
            emit.text(`sys.null`);
            return;

        case 'ParenthesisedExpression':
            // TODO: emit extra parens?
            emitExpression(emit, expr.expression, symbolTable);
            return;

        case 'RecordExpression':
            emit.text('sys.record([').indent();
            for (let field of expr.fields) {
                emit.down(1).text('{').indent();
                emit.down(1).text(`name: '${field.name}',`);
                emit.down(1).text(`value: `);
                emitExpression(emit, field.value, symbolTable);
                emit.text(',').dedent().down(1).text('},');
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
            if (expr.abstract || expr.concrete) emit.text(`sys.${expr.abstract ? 'abstract' : 'concrete'}(`);
            emit.text(`sys.string(${JSON.stringify(expr.value)})`);
            if (expr.abstract || expr.concrete) emit.text(')');
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
