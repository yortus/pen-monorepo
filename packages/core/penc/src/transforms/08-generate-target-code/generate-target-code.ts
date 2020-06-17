import * as fs from 'fs';
import * as path from 'path';
import * as AstNodes from '../../ast-nodes';
import {SymbolTable} from '../../symbol-table';
import {assert, makeNodeVisitor} from '../../utils';
import {Metadata} from '../07-check-semantics';
import {Emitter, makeEmitter} from './emitter';


type Program = AstNodes.Program<Metadata>;
type Expression = AstNodes.Expression<Metadata>;
type SelectionExpression = AstNodes.SelectionExpression<Metadata>;
type SequenceExpression = AstNodes.SequenceExpression<Metadata>;
type StringLiteralExpression = AstNodes.StringLiteralExpression<Metadata>;


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

    // TODO: Emit definitions for all symbols (ie module bindings where lhs is a VariablePattern)
    emitSymbolDefinitions(emit, program);

    // TODO: Emit compile-time constants...
    emitConstants(emit, program);

    // TODO: emit epilog for `createProgram` function
    let start = program.meta.symbolTable.getSymbolById(program.meta.startSymbolId);
    assert(start.kind === 'NameSymbol');
    emit.down(2).text(`return ${start.scope.id}('${start.sourceName}');`);
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
            emit.down(1).text(`const createExtension${ext.meta.scope.id} = (() => {`).indent();
            let content = fs.readFileSync(ext.path, 'utf8') + '\n';
            content.split(/[\r\n]+/).filter(line => !!line.trim()).forEach(line => emit.down(1).text(line));
            emit.down(2).text(`return (staticOptions) => {`).indent();
            ext.exportedNames.forEach(name => emit.down(1).text(`let _${name} = ${name}(staticOptions);`));
            emit.down(1).text(`return (name) => {`).indent();
            emit.down(1).text(`switch(name) {`).indent();
            ext.exportedNames.forEach(name => emit.down(1).text(`case '${name}': return _${name};`));
            emit.down(1).text(`default: return undefined;`);
            emit.dedent().down(1).text('}');
            emit.dedent().down(1).text('};');
            emit.dedent().down(1).text('};');
            emit.dedent().down(1).text('})();');
        },
    }));
}


function emitSymbolDefinitions(emit: Emitter, program: Program) {
    const {symbolTable} = program.meta;
    let visitNode = makeNodeVisitor<AstNodes.Node<Metadata>>();
    visitNode(program, rec => ({
        ExtensionFile: ext => {
            let scope = ext.meta.scope;
            emit.down(2).text(`const ${scope.id} = createExtension${scope.id}({inForm, outForm});`);
        },
        PenSourceFile: sf => {
            emit.down(2).text(`// -------------------- ${path.basename(sf.path)} --------------------`);
            rec(sf.module);
        },
        Module: mod => {
            // Emit module definition
            let moduleScope = mod.meta.scope;
            emit.down(2).text(`function ${moduleScope.id}(name) {`).indent();
            emit.down(1).text(`switch (name) {`).indent();
            for (let sourceName of moduleScope.sourceNames.keys()) {
                emit.down(1).text(`case '${sourceName}': return ${moduleScope.id}_${sourceName};`);
            }
            emit.down(1).text(`default: return undefined;`);
            emit.dedent().down(1).text(`}`);
            emit.dedent().down(1).text(`}`);

            // Emit definitions for each module binding
            for (let {pattern, value} of mod.bindings) {
                if (pattern.kind === 'ModulePattern' && pattern.names.length > 0) {
                    // Each ModulePatternName *must* be an alias to a name in the rhs module
                    for (let {name, meta: {symbolId}} of pattern.names) {
                        let symbol = symbolTable.getSymbolById(symbolId);
                        assert(symbol.kind === 'NameSymbol');
                        let {scope, sourceName} = symbol;
                        let qualName = `${scope.id}_${sourceName}`;
                        emit.down(1).text(`function ${qualName}(arg) { return `);
                        emitExpression(emit, value, symbolTable); // rhs *must* be a module
                        emit.text(`('${name}')(arg); }`); // TODO: still needs fixing...
                    }
                }
                else if (pattern.kind === 'VariablePattern') {
                    let symbol = symbolTable.getSymbolById(pattern.meta.symbolId);
                    assert(symbol.kind === 'NameSymbol');
                    let {scope, sourceName} = symbol;
                    let qualName = `${scope.id}_${sourceName}`;
                    emit.down(2).text(`function ${qualName}(arg) {`).indent();
                    emit.down(1).text(`if (!${qualName}_memo) ${qualName}_memo = `);
                    emitExpression(emit, value, symbolTable);
                    emit.text(`;`).down(1).text(`return ${qualName}_memo(arg);`);
                    emit.dedent().down(1).text('}');
                    emit.down(1).text(`let ${qualName}_memo;`);
                }
            }

            // Visit all child nodes recursively
            mod.bindings.forEach(rec);
        },
    }));
}


function emitConstants(emit: Emitter, program: Program) {
    const {symbolTable} = program.meta;
    let visitNode = makeNodeVisitor<AstNodes.Node<Metadata>>();
    emit.down(2).text(`// -------------------- Compile-time constants --------------------`);
    visitNode(program, rec => ({
        Module: mod => {
            for (let {pattern} of mod.bindings) {
                if (pattern.kind === 'VariablePattern') {
                    let symbol = symbolTable.getSymbolById(pattern.meta.symbolId);
                    assert(symbol.kind === 'NameSymbol');
                    if (!symbol.constant) continue;
                    emit.down(1).text(`${symbol.scope.id}('${symbol.sourceName}').constant = {value: `);
                    emitConstant(emit, symbol.constant.value);
                    emit.text('};');
                }
            }
            mod.bindings.forEach(rec);
        },
    }));
}


function emitExpression(emit: Emitter, expr: Expression, symbolTable: SymbolTable) {
    switch (expr.kind) {
        case 'ApplicationExpression':
            emit.text('(');
            emitExpression(emit, expr.lambda, symbolTable);
            emit.text(')(');
            emitExpression(emit, expr.argument, symbolTable);
            emit.text(`)`);
            return;

        case 'BindingLookupExpression':
            emitExpression(emit, expr.module, symbolTable);
            emit.text(`('${expr.bindingName}')`);
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
            let ref = symbolTable.getSymbolById(expr.meta.symbolId);
            assert(ref.kind === 'NameSymbol');
            emit.text(`${ref.scope.id}('${ref.sourceName}')`);
            return;

        case 'SelectionExpression':
            emitSelectionExpression(emit, expr, symbolTable);
            return;

        case 'SequenceExpression':
            emitSequenceExpression(emit, expr, symbolTable);
            return;

        case 'StringLiteralExpression': {
            emitStringLiteralExpression(emit, expr);
            return;
        }

        default:
            throw new Error('Internal Error'); // TODO...
    }
}


function emitSelectionExpression(emit: Emitter, expr: SelectionExpression, symbolTable: SymbolTable) {
    const arity = expr.expressions.length;
    emit.text('(() => {').indent();
    // ...
    for (let i = 0; i < arity; ++i) {
        emit.down(1).text(`let expr${i} = `);
        emitExpression(emit, expr.expressions[i], symbolTable);
        emit.text(';');
    }
    emit.down(1).text('return function SEL() {').indent();
    for (let i = 0; i < arity; ++i) {
        emit.down(1).text(`if (expr${i}()) return true;`);
    }
    emit.down(1).text('return false;');
    emit.dedent().down(1).text('}');
    emit.dedent().down(1).text('})()');
}


function emitSequenceExpression(emit: Emitter, expr: SequenceExpression, symbolTable: SymbolTable) {
    const arity = expr.expressions.length;
    emit.text('(() => {').indent();
    // ...
    for (let i = 0; i < arity; ++i) {
        emit.down(1).text(`let expr${i} = `);
        emitExpression(emit, expr.expressions[i], symbolTable);
        emit.text(';');
    }
    emit.down(1).text('return function SEQ() {').indent();
    emit.down(1).text('let stateₒ = getState();');
    emit.down(1).text('let out;');
    for (let i = 0; i < arity; ++i) {
        emit.down(1).text(`if (expr${i}()) out = concat(out, OUT); else return setState(stateₒ), false;`);
    }
    emit.down(1).text('OUT = out;');
    emit.down(1).text('return true;');
    emit.dedent().down(1).text('}');
    emit.dedent().down(1).text('})()');
}


function emitStringLiteralExpression(emit: Emitter, expr: StringLiteralExpression) {

    let m = `${expr.abstract ? `_ !== "ast" ? "nil" : ` : ''}_${expr.concrete ? ` !== "txt" ? "nil" : _` : ''}`;
    const length = expr.value.length;
    emit.text('(() => {').indent();
    emit.down(1).text(`const inFormHere = ${m.replace(/_/g, 'inForm')}`);
    emit.down(1).text(`const outFormHere = ${m.replace(/_/g, 'outForm')}`);
    emit.down(1).text(`const checkInType = inFormHere !== 'txt';`);
    emit.down(1).text(`const out = outFormHere === 'nil' ? undefined : ${JSON.stringify(expr.value)};`);
    emit.down(1).text(`if (inFormHere === 'nil') return function STR() { OUT = out; return true; }`);
    emit.down(1).text('return function STR() {').indent();
    emit.down(1).text(`if (checkInType && typeof IN !== 'string') return false;`);
    emit.down(1).text(`if (IP + ${length} > IN.length) return false;`);
    for (let i = 0; i < length; ++i) {
        emit.down(1).text(`if (IN.charCodeAt(IP + ${i}) !== ${expr.value.charCodeAt(i)}) return false;`);
    }
    emit.down(1).text(`IP += ${length};`);
    emit.down(1).text(`OUT = out;`);
    emit.down(1).text(`return true;`);
    emit.dedent().down(1).text('}');
    emit.dedent().down(1).text('})()');
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
