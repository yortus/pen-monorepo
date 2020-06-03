import * as fs from 'fs';
import * as path from 'path';
import * as AstNodes from '../../ast-nodes';
import {SymbolTable} from '../../symbol-table';
import {assert, makeNodeVisitor} from '../../utils';
import {Metadata} from '../07-check-semantics';
import {Emitter, makeEmitter} from './emitter';


type Program = AstNodes.Program<Metadata>;
type Expression = AstNodes.Expression<Metadata>;


// TODO: doc...
export function generateTargetCode(program: Program) {
    return emitProgram(program);
}


function emitProgram(program: Program) {
    const emit = makeEmitter();

    // TODO: temp testing... emit runtime... penrt.js is copied into the dist/ dir as part of the postbuild script
    const RUNTIME_PATH = require.resolve('../../deps/penrt');
    let content = fs.readFileSync(RUNTIME_PATH, 'utf8') + '\n';
    content.split(/[\r\n]+/).filter(line => !!line.trim()).forEach(line => emit.down(1).text(line));

    // TODO: emit extensions
    emitExtensions(emit, program);

    // TODO: emit prolog for `createProgram` function
    emit.down(2).text('function createProgram({inForm, outForm}) {').indent();

    // Emit declarations for all symbols before any are defined.
    emitSymbolDeclarations(emit, program.meta.symbolTable);

    // TODO: Emit aliases...
    emitSymbolAliases(emit, program);

    // TODO: Emit compile-time constants...
    emitConstants(emit, program);

    // TODO: Emit definitions for all symbols (ie module bindings where lhs is a VariablePattern)
    emitSymbolDefinitions(emit, program);

    // TODO: emit epilog for `create` function
    let start = program.meta.symbolTable.lookupById(program.meta.startSymbolId);
    assert(start.kind === 'Binding');
    emit.down(2).text(`return ${start.scope.id}.bindings.${start.id};`);
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
            if (ext.meta.scope.kind !== 'Extension') return;
            emit.down(1).text(`const create${ext.meta.scope.id} = (() => {`).indent();
            let content = fs.readFileSync(ext.path, 'utf8') + '\n';
            content.split(/[\r\n]+/).filter(line => !!line.trim()).forEach(line => emit.down(1).text(line));
            emit.down(2).text(`return (staticOptions) => ({`).indent();
            emit.down(1).text(`bindings: {`).indent();
            ext.exportedNames.forEach(name => {
                let symbol = program.meta.symbolTable.lookupBySourceName(name, ext.meta.scope);
                emit.down(1).text(`${symbol.id}: ${name}(staticOptions),`);
            });
            emit.dedent().down(1).text('}');
            emit.dedent().down(1).text('});');
            emit.dedent().down(1).text('})();');
        },
    }));
}


function emitSymbolDeclarations(emit: Emitter, symbolTable: SymbolTable) {
    for (let scope of symbolTable.getAllScopes()) {
        // TODO: doc... basically allocates vars for every module in the program (modules/scopes are mapped 1:1)
        if (!scope.scope) continue; // TODO: skip the root scope for now... revise?

        // TODO: temp testing...
        if (scope.kind === 'Extension') {
            emit.down(2).text(`const ${scope.id} = create${scope.id}({inForm, outForm});`);
            continue;
        }

        emit.down(2).text(`const ${scope.id} = {`).indent();
        emit.down(1).text(`bindings: {`).indent();
        for (let symbol of scope.sourceNames.values()) {
            emit.down(1).text(`${symbol.id}: {},`);
        }
        emit.dedent().down(1).text(`},`);
        emit.dedent().down(1).text(`};`);
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
                    for (let {name, meta: {symbolId}} of pattern.names) {
                        let symbol = symbolTable.lookupById(symbolId);
                        assert(symbol.kind === 'Binding');
                        emit.down(1).text(`${symbol.scope.id}.bindings.${symbol.id} = `);
                        emitExpression(emit, value, symbolTable); // rhs *must* be a module
                        emit.text(`.bindings.${name};`); // TODO: still needs fixing...
                    }
                }
                else if (pattern.kind === 'VariablePattern' && isLValue(value)) {
                    let symbol = symbolTable.lookupById(pattern.meta.symbolId);
                    assert(symbol.kind === 'Binding');
                    emit.down(1).text(`${symbol.scope.id}.bindings.${symbol.id} = `);
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
                    let symbol = symbolTable.lookupById(pattern.meta.symbolId);
                    assert(symbol.kind === 'Binding');
                    if (!symbol.constant) continue;
                    emit.down(1).text(`${symbol.scope.id}.bindings.${symbol.id}.constant = {value: `);
                    emitConstant(emit, symbol.constant.value);
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
                    let symbol = symbolTable.lookupById(pattern.meta.symbolId);
                    assert(symbol.kind === 'Binding');
                    emit.down(2).text(`Object.assign(`).indent();
                    emit.down(1).text(`${symbol.scope.id}.bindings.${symbol.id},`).down(1);
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
            emit.text(expr.meta.scope.id);
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
            emit.text(expr.module.meta.scope.id);
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
            let ref = symbolTable.lookupById(expr.meta.symbolId);
            assert(ref.kind === 'Binding');
            emit.text(`${ref.scope.id}.bindings.${ref.id}`);
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
    // BUG: BindingLookupExpression belongs here too...
    // TODO: ^^^
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
