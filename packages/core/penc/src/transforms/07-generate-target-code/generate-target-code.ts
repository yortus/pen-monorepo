import * as fs from 'fs';
import * as path from 'path';
import * as AstNodes from '../../ast-nodes';
import {Scope, SymbolTable} from '../../symbol-table';
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

    // TODO: top-level validation. Move these checks to an earlier transform step...
    let sourceFile = program.sourceFiles.get(program.mainPath)!;
    if (sourceFile.kind !== 'PenSourceFile') throw new Error(`Main module must be a pen module, not an extension.`);
    let mainModule = sourceFile.module;
    if (!mainModule.meta.scope.symbols.has('start')) throw new Error(`Main module must define a 'start' rule.`);

    // TODO: temp testing... emit runtime... penrt.js is copied into the dist/ dir as part of the postbuild script
    const RUNTIME_PATH = require.resolve('../../deps/penrt');
    let content = fs.readFileSync(RUNTIME_PATH, 'utf8') + '\n';
    content.split(/[\r\n]+/).filter(line => !!line.trim()).forEach(line => emit.down(1).text(line));

    // TODO: emit extensions
    emitExtensions(emit, program);

    // TODO: emit prolog for `createProgram` function
    emit.down(2).text('function createProgram({inForm, outForm}) {').indent();

    // Emit declarations for all symbols before any are defined.
    emitSymbolDeclarations(emit, program.meta.rootScope);

    // TODO: Emit aliases...
    emitSymbolAliases(emit, program);

    // TODO: Emit compile-time constants...
    emitConstants(emit, program);

    // TODO: Emit definitions for all symbols (ie module bindings where lhs is a VariablePattern)
    emitSymbolDefinitions(emit, program);

    // TODO: emit epilog for `create` function
    emit.down(2).text(`return ${mainModule.meta.scope.scopeSymbol.name}.bindings.start;`);
    emit.dedent().down(1).text('}');

    // TODO: Emit main exports... must come after symbol decls, since it refs the start rule
    emit.down(2).text(`// -------------------- Main exports --------------------`);
    emit.down(1).text(`module.exports = createMainExports(createProgram);`);

    // All done.
    return emit.down(1).toString();
}


function emitExtensions(emit: Emitter, program: Program) {
    let visitNode = makeNodeVisitor<AstNodes.Node<Metadata>>();
    emit.down(2).text(`// -------------------- Extensions --------------------`);
    visitNode(program, _ => ({
        ExtensionFile: ext => {
            if (ext.meta.scope.kind !== 'extension') return;
            emit.down(1).text(`const create${ext.meta.scope.scopeSymbol.name} = (() => {`).indent();
            let content = fs.readFileSync(ext.path, 'utf8') + '\n';
            content.split(/[\r\n]+/).filter(line => !!line.trim()).forEach(line => emit.down(1).text(line));
            emit.down(2).text(`return (staticOptions) => ({`).indent();
            emit.down(1).text(`bindings: {`).indent();
            ext.exportedNames.forEach(name => emit.down(1).text(`${name}: ${name}(staticOptions),`));
            emit.dedent().down(1).text('}');
            emit.dedent().down(1).text('});');
            emit.dedent().down(1).text('})();');
        },
    }));
}


function emitSymbolDeclarations(emit: Emitter, rootScope: Scope) {
    visitScope(rootScope);

    function visitScope(scope: Scope) {
        // TODO: doc... basically allocates vars for every module in the program (modules/scopes are mapped 1:1)
        if (scope.parent) { // TODO: skip the root scope for now... revise?

            // TODO: temp testing...
            if (scope.kind === 'extension') {
                emit.down(2).text(`const ${scope.scopeSymbol.name} = create${scope.scopeSymbol.name}({inForm, outForm});`);
                return;
            }

            emit.down(2).text(`const ${scope.scopeSymbol.name} = {`).indent();
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
    emit.down(2).text(`// -------------------- Aliases --------------------`);
    visitNode(program, rec => ({
        Module: module => {
            for (let {pattern, value} of module.bindings) {
                if (pattern.kind === 'ModulePattern' && pattern.names.length > 0) {
                    // Each ModulePatternName *must* be an alias to a name in the rhs module
                    for (let {name, alias, meta: {symbolId}} of pattern.names) {
                        let {scope} = symbolTable.lookup(symbolId);
                        emit.down(1).text(`${scope.scopeSymbol.name}.bindings.${alias || name} = `);
                        emitExpression(emit, value, symbolTable); // rhs *must* be a module
                        emit.text(`.bindings.${name};`);
                    }
                }
                else if (pattern.kind === 'VariablePattern' && isLValue(value)) {
                    let {name, scope} = symbolTable.lookup(pattern.meta.symbolId);
                    emit.down(1).text(`${scope.scopeSymbol.name}.bindings.${name} = `);
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
    emit.down(2).text(`// -------------------- Compile-time constants --------------------`);
    visitNode(program, rec => ({
        Module: module => {
            for (let {pattern} of module.bindings) {
                if (pattern.kind === 'VariablePattern') {
                    let {scope, name, constant} = symbolTable.lookup(pattern.meta.symbolId);
                    if (!constant) continue;
                    emit.down(1).text(`${scope.scopeSymbol.name}.bindings.${name}.constant = {value: `);
                    emitConstant(emit, constant.value);
                    emit.text('};');

                }
            }
            module.bindings.forEach(rec);
        },
    }));
}


function emitSymbolDefinitions(emit: Emitter, program: Program) {
    // Emit extension definitions *before* definitions from pen modules
    // TODO: this masks a def-ordering problem that will re-appear when lambda defns are implemented. Fix it properly...
    const {symbolTable} = program.meta;
    let visitNode = makeNodeVisitor<AstNodes.Node<Metadata>>();
    // TODO: was... remove...
    // visitNode(program, _ => ({
    //     ExtensionFile: ef => {
    //         emit.down(2).text(`// -------------------- ${path.basename(ef.path)} --------------------`);
    //         for (let name of ef.exportedNames) {
    //             emit.down(2).text(`Object.assign(`).indent();
    //             emit.down(1).text(`${ef.meta.scope.scopeSymbol.name}.bindings.${name},`).down(1);
    //             emit.text(`ext_${ef.meta.scope.scopeSymbol.name}.${name}({inForm, outForm}),`);
    //             emit.dedent().down(1).text(`);`);
    //         }
    //     },
    // }));
    visitNode(program, rec => ({
        PenSourceFile: sf => {
            emit.down(2).text(`// -------------------- ${path.basename(sf.path)} --------------------`);
            rec(sf.module);
        },
        Module: module => {
            // Emit non-alias definitions - i.e. things not already emitted by emitSymbolAliases()
            for (let {pattern, value} of module.bindings) {
                if (pattern.kind === 'VariablePattern' && !isLValue(value)) {
                    let {name, scope} = symbolTable.lookup(pattern.meta.symbolId);
                    emit.down(2).text(`Object.assign(`).indent();
                    emit.down(1).text(`${scope.scopeSymbol.name}.bindings.${name},`).down(1);
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
            emit.text('(');
            emitExpression(emit, expr.lambda, symbolTable);
            emit.text(').lambda(');
            emitExpression(emit, expr.argument, symbolTable);
            emit.text(`)`);
            return;

        case 'BindingLookupExpression':
            emitExpression(emit, expr.module, symbolTable);
            emit.text(`.bindings.${expr.bindingName}`);
            return;

        case 'BooleanLiteralExpression':
            emit.text(`booleanLiteral({inForm, outForm, value: ${expr.value}})`);
            return;

        case 'FieldExpression':
            emit.text('field({').indent();
            emit.down(1).text('inForm,').down(1).text('outForm,');
            emit.down(1).text('name: ');
            emitExpression(emit, expr.name, symbolTable);
            emit.text(',').down(1).text('value: ');
            emitExpression(emit, expr.value, symbolTable);
            emit.text(',').dedent().down(1).text('})');
            return;

        case 'ImportExpression':
            emit.text(expr.meta.scope.scopeSymbol.name);
            return;

        // case 'LambdaExpression':
        //     break; // TODO...

        case 'ListExpression':
            emit.text('list({').indent();
            emit.down(1).text('inForm,').down(1).text('outForm,');
            emit.down(1).text('elements: [');
            if (expr.elements.length > 0) {
                emit.indent();
                for (let element of expr.elements) {
                    emit.down(1);
                    emitExpression(emit, element, symbolTable);
                    emit.text(',');
                }
                emit.dedent().down(1);
            }
            emit.text('],').dedent().down(1).text('})');
            return;

        case 'ModuleExpression':
            emit.text(expr.module.meta.scope.scopeSymbol.name);
            return;

        case 'NotExpression':
            emit.text(`not({`).indent();
            emit.down(1).text('inForm,').down(1).text('outForm,');
            emit.down(1).text('expression: ');
            emitExpression(emit, expr.expression, symbolTable);
            emit.text(',');
            emit.dedent().down(1).text('})');
            return;

        case 'NullLiteralExpression':
            emit.text(`nullLiteral({inForm, outForm})`);
            return;

        case 'NumericLiteralExpression':
            emit.text(`numericLiteral({inForm, outForm, value: ${expr.value}})`);
            return;

        case 'ParenthesisedExpression':
            // TODO: emit extra parens?
            emitExpression(emit, expr.expression, symbolTable);
            return;

        case 'QuantifiedExpression':
            emit.text(`${expr.quantifier === '?' ? 'zeroOrOne' : 'zeroOrMore'}({`).indent();
            emit.down(1).text('inForm,').down(1).text('outForm,');
            emit.down(1).text('expression: ');
            emitExpression(emit, expr.expression, symbolTable);
            emit.text(',');
            emit.dedent().down(1).text('})');
            return;

        case 'RecordExpression':
            emit.text('record({').indent();
            emit.down(1).text('inForm,').down(1).text('outForm,');
            emit.down(1).text('fields: [');
            if (expr.fields.length > 0) {
                emit.indent();
                for (let field of expr.fields) {
                    emit.down(1).text('{').indent();
                    emit.down(1).text(`name: '${field.name}',`);
                    emit.down(1).text(`value: `);
                    emitExpression(emit, field.value, symbolTable);
                    emit.text(',').dedent().down(1).text('},');
                }
                emit.dedent().down(1);
            }
            emit.text('],').dedent().down(1).text('})');
            return;

        case 'ReferenceExpression':
            let ref = symbolTable.lookup(expr.meta.symbolId);
            emit.text(`${ref.scope.scopeSymbol.name}.bindings.${ref.name}`);
            return;

        case 'SelectionExpression':
            emit.text('selection({').indent();
            emit.down(1).text('inForm,').down(1).text('outForm,');
            emit.down(1).text('expressions: [').indent();
            for (let arg of expr.expressions) {
                emit.down(1);
                emitExpression(emit, arg, symbolTable);
                emit.text(',');
            }
            emit.dedent().down(1).text('],').dedent().down(1).text(`})`);
            return;

        case 'SequenceExpression':
            emit.text('sequence({').indent();
            emit.down(1).text('inForm,').down(1).text('outForm,');
            emit.down(1).text('expressions: [').indent();
            for (let arg of expr.expressions) {
                emit.down(1);
                emitExpression(emit, arg, symbolTable);
                emit.text(',');
            }
            emit.dedent().down(1).text('],').dedent().down(1).text(`})`);
            return;

        case 'StringLiteralExpression': {
            let m = `${expr.abstract ? `_ !== "ast" ? "nil" : ` : ''}_${expr.concrete ? ` !== "txt" ? "nil" : _` : ''}`;
            emit.text('stringLiteral({').indent();
            emit.down(1).text(`inForm: ${m.replace(/_/g, 'inForm')},`);
            emit.down(1).text(`outForm: ${m.replace(/_/g, 'outForm')},`);
            emit.down(1).text(`value: ${JSON.stringify(expr.value)},`);
            emit.dedent().down(1).text('})');
            return;
        }

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
