import * as fs from 'fs';
import * as path from 'path';
import * as AstNodes from '../../ast-nodes';
import {Scope} from '../../scope';
import {SymbolTable} from '../../symbol-table';
import {makeNodeVisitor} from '../../utils';
import {Metadata} from '../05-resolve-constant-values';
import {Emitter, makeEmitter} from './emitter';


type Program = AstNodes.Program<Metadata>;
type Expression = AstNodes.Expression<Metadata>;


// TODO: doc...
export function generateTargetCode(program: Program) {
    return emitProgram(program);
}


function emitProgram(program: Program) {
    const emit = makeEmitter();

    // TODO: temp testing... emit runtime + builtins code
    const RUNTIME_PATH = require.resolve('penrt');
    let content = fs.readFileSync(RUNTIME_PATH, 'utf8') + '\n';
    content.split(/[\r\n]+/).filter(line => !!line.trim()).forEach(line => {
        emit.down(1).text(line);
    });

    // Emit declarations for all symbols before any are defined.
    emitSymbolDeclarations(emit, program.meta.rootScope);

    // TODO: Emit aliases...
    emitSymbolAliases(emit, program);

    // TODO: Emit compile-time constants...
    emitConstants(emit, program);

    // TODO: Emit definitions for all symbols (ie module bindings where lhs is a VariablePattern)
    emitSymbolDefinitions(emit, program);

    // TODO: Emit main exports... must come after symbol decls, since it refs the start rule
    emit.down(2).text(`// -------------------- MAIN EXPORTS --------------------`);
    emitMainExports(emit, program);

    // All done.
    return emit.toString();
}


function emitMainExports(emit: Emitter, program: Program) {
    let mainModule = program.sourceFiles.get(program.mainPath)!.module;
    if (!mainModule.meta.scope.symbols.has('start')) throw new Error(`Main module must define a 'start' rule.`);
    emit.down(2).text(`module.exports = createMainExports(𝕊${mainModule.meta.scope.id}.bindings.start);`);
}


function emitSymbolDeclarations(emit: Emitter, rootScope: Scope) {
    visitScope(rootScope);

    function visitScope(scope: Scope) {
        // TODO: doc... basically allocates vars for every module in the program (modules/scopes are mapped 1:1)
        if (scope.parent) { // TODO: skip the root scope for now... revise?
            emit.down(2).text(`const 𝕊${scope.id} = {`).indent();
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
    let visitNode = makeNodeVisitor<AstNodes.Node<Metadata>>();
    emit.down(2).text(`// -------------------- aliases --------------------`);
    visitNode(program, rec => ({
        Module: module => {
            for (let {pattern, value} of module.bindings) {
                if (pattern.kind === 'ModulePattern' && pattern.names.length > 0) {
                    // Each ModulePatternName *must* be an alias to a name in the rhs module
                    for (let {name, alias, meta: {symbolId}} of pattern.names) {
                        let {scope} = symbolTable.lookup(symbolId);
                        emit.down(1).text(`𝕊${scope.id}.bindings.${alias || name} = `);
                        emitExpression(emit, value, symbolTable); // rhs *must* be a module
                        emit.text(`.bindings.${name};`);
                    }
                }
                else if (pattern.kind === 'VariablePattern' && isLValue(value)) {
                    let {name, scope} = symbolTable.lookup(pattern.meta.symbolId);
                    emit.down(1).text(`𝕊${scope.id}.bindings.${name} = `);
                    emitExpression(emit, value, symbolTable);
                    emit.text(';');
                }
            }
            module.bindings.forEach(rec);
        },
    }));
}


function emitConstants(emit: Emitter, program: Program) {
    const {symbolTable} = program.meta;
    let visitNode = makeNodeVisitor<AstNodes.Node<Metadata>>();
    emit.down(2).text(`// -------------------- compile-time constants --------------------`);
    visitNode(program, rec => ({
        Module: module => {
            for (let {pattern} of module.bindings) {
                if (pattern.kind === 'VariablePattern') {
                    let {scope, name, constant} = symbolTable.lookup(pattern.meta.symbolId);
                    if (!constant) continue;
                    emit.down(1).text(`𝕊${scope.id}.bindings.${name}.constant = {value: `);
                    emitConstant(emit, constant.value);
                    emit.text('};');

                }
            }
            module.bindings.forEach(rec);
        },
    }));
}


function emitSymbolDefinitions(emit: Emitter, program: Program) {
    const {symbolTable} = program.meta;
    let visitNode = makeNodeVisitor<AstNodes.Node<Metadata>>();
    visitNode(program, rec => ({
        SourceFile: sf => {
            emit.down(2).text(`// -------------------- ${path.basename(sf.path)} --------------------`);
            rec(sf.module);
        },
        Module: module => {
            // Emit non-alias definitions - i.e. things not already emitted by emitSymbolAliases()
            for (let {pattern, value} of module.bindings) {
                if (pattern.kind === 'VariablePattern' && !isLValue(value)) {
                    let {name, scope} = symbolTable.lookup(pattern.meta.symbolId);
                    emit.down(2).text(`Object.assign(`).indent();
                    emit.down(1).text(`𝕊${scope.id}.bindings.${name},`).down(1);
                    emitExpression(emit, value, symbolTable);
                    emit.dedent().down(1).text(`);`);
                }
            }
            module.bindings.forEach(rec);
        },
    }));
}


function emitExpression(emit: Emitter, expr: Expression, symbolTable: SymbolTable) {
    switch (expr.kind) {
        case 'ApplicationExpression':
            emit.text('apply(').indent().down(1);
            emitExpression(emit, expr.lambda, symbolTable);
            emit.text(',').down(1);
            emitExpression(emit, expr.argument, symbolTable);
            emit.dedent().down(1).text(`)`);
            return;

        case 'BindingLookupExpression':
            emitExpression(emit, expr.module, symbolTable);
            emit.text(`.bindings.${expr.bindingName}`);
            return;

        case 'BooleanLiteralExpression':
            emit.text(`booleanLiteral(${expr.value})`);
            return;

        case 'CharacterExpression':
            if (expr.abstract || expr.concrete) emit.text(`${expr.abstract ? 'abstract' : 'concrete'}(`);
            emit.text('character(');
            emit.text(JSON.stringify(expr.minValue)).text(', ').text(JSON.stringify(expr.maxValue)).text(')');
            if (expr.abstract || expr.concrete) emit.text(')');
            return;

        case 'FieldExpression':
            emit.text('field(').indent().down(1);
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
            emit.text('list([').indent();
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

        case 'NullLiteralExpression':
            emit.text(`nullLiteral`);
            return;

        case 'NumericLiteralExpression':
            emit.text(`numericLiteral(${expr.value})`);
            return;

        case 'ParenthesisedExpression':
            // TODO: emit extra parens?
            emitExpression(emit, expr.expression, symbolTable);
            return;

        case 'RecordExpression':
            emit.text('record([').indent();
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
            emitCall(emit, 'selection', expr.expressions, symbolTable);
            return;

        case 'SequenceExpression':
            emitCall(emit, 'sequence', expr.expressions, symbolTable);
            return;

        case 'StringLiteralExpression':
            if (expr.abstract || expr.concrete) emit.text(`${expr.abstract ? 'abstract' : 'concrete'}(`);
            emit.text(`stringLiteral(${JSON.stringify(expr.value)})`);
            if (expr.abstract || expr.concrete) emit.text(')');
            return;

        default:
            throw new Error('Internal Error'); // TODO...
    }
}


// TODO: helper function
function isLValue(e: Expression) {
    return e.kind === 'ImportExpression' || e.kind === 'ModuleExpression' || e.kind === 'ReferenceExpression';
}


// TODO: helper function
function emitConstant(emit: Emitter, value: unknown) {
    if (typeof value === 'number' || typeof value === 'boolean' || value === 'null') {
        emit.text(String(value));
    }
    else if (typeof value === 'string') {
        emit.text(JSON.stringify(value));
    }
    else {
        throw new Error(`Unsupported constant type '${typeof value}'`); // TODO: revisit when more const types exist
    }
}


// TODO: helper function
function emitCall(emit: Emitter, fn: string, args: ReadonlyArray<Expression>, symbolTable: SymbolTable) {
    emit.text(fn).text(`(`).indent();
    args.forEach((arg, i) => {
        emit.down(1);
        emitExpression(emit, arg, symbolTable);
        if (i < args.length - 1) emit.text(',');
    });
    emit.dedent().down(1).text(`)`);
}
