// TODO: error on unreferenced non-exported bindings. Need to impl exports properly first...


import * as objectHash from 'object-hash';
import {ExtractNode, traverseAst} from '../../abstract-syntax-trees';
import type {ResolvedProgram} from '../../representations';
import {assert} from '../../utils';


// TODO: jsdoc...
export function createFlatExpressionList(program: ResolvedProgram): FlatExpressionList {

    // ENTRY rules:
    // a. the expression in an ENTRY is always 'flat' - any subexpressions are ReferenceExpressions to other ENTRYs
    // b. each ENTRY has a unique name (to facilitate rule (a)). Can be human-readable / linked to source names
    // c. ENTRY expressions are never ReferenceExpressions - these are always resolved before creating entries
    // d. ENTRY expressions *may be* MemberExpressions, if they cannot be resolved

    // Make a flat list of every GlobalBinding in the entire program.
    const allBindings = [] as GlobalBinding[];
    traverseAst(program.sourceFiles, n => n.kind === 'GlobalBinding' ? allBindings.push(n) : 0);

    // Create helper functions for this program.
    let resolve = createResolver(program, allBindings);
    let getHashFor = createHasher(resolve);

    // Find the `start` expression.
    let startExpr = allBindings.find(n => n.globalName === program.startGlobalName)?.value;
    assert(startExpr);

    // Populate the `entriesByHash` map.
    let entriesByHash = new Map<string, Entry>();
    let counter = 0;
    let startEntry = getEntryFor(startExpr); // NB: called for side-effect of populating `entriesByHash` map.

    // TODO: temp testing... build the one and only internal module for emitting
    let flatList = {} as Record<string, Expression>;
    for (let {globalName, expr} of entriesByHash.values()) flatList[globalName] = expr;
    return {startName: startEntry.globalName, flatList};

    // TODO: recursive...
    function getEntryFor(e: Expression): Entry {
        e = resolve(e);
        let hash = getHashFor(e);
        if (entriesByHash.has(hash)) return entriesByHash.get(hash)!;
        let entry: Entry = {globalName: `id${++counter}`, expr: undefined!};
        entriesByHash.set(hash, entry);

        // Set `entry.expr` to a new shallow expr, and return `entry`.
        switch (e.kind) {
            case 'ApplicationExpression': return setX(e, {lambda: ref(e.lambda), argument: ref(e.argument)});
            case 'BooleanLiteralExpression': return setX(e);
            case 'ExtensionExpression': return setX(e);
            case 'FieldExpression': return setX(e, {name: ref(e.name), value: ref(e.value)});
            case 'GlobalReferenceExpression': assert(false); // the resolve() call removed this node kind
            case 'ImportExpression': assert(false); // the resolve() call removed this node kind
            case 'ListExpression': return setX(e, {elements: e.elements.map(ref)});
            case 'MemberExpression': return setX(e, {module: ref(e.module), bindingName: e.bindingName});
            case 'ModuleExpression': {
                let bindings = e.module.bindings.map(binding => ({...binding, value: ref(binding.value)}));
                return setX(e, {module: {kind: 'Module', bindings}});
            }
            case 'NotExpression': return setX(e, {expression: ref(e.expression)});
            case 'NullLiteralExpression': return setX(e);
            case 'NumericLiteralExpression': return setX(e);
            case 'QuantifiedExpression': return setX(e, {expression: ref(e.expression), quantifier: e.quantifier});
            case 'RecordExpression': return setX(e, {fields: e.fields.map(f => ({name: f.name, value: ref(f.value)}))});
            case 'SelectionExpression': return setX(e, {expressions: e.expressions.map(ref)});
            case 'SequenceExpression': return setX(e, {expressions: e.expressions.map(ref)});
            case 'StringLiteralExpression': return setX(e);
            default: ((assertNoKindsLeft: never) => { throw new Error(`Unhandled node ${assertNoKindsLeft}`); })(e);
        }

        function ref(expr: Expression): GlobalReferenceExpression {
            // TODO: set globalName to something proper? use same value as `name`?
            return {kind: 'GlobalReferenceExpression', localName: '', globalName: getEntryFor(expr).globalName};
        }

        function setX<E extends Expression>(expr: E, vals?: Omit<E, 'kind'>) {
            entry.expr = Object.assign({kind: expr.kind}, vals || expr) as unknown as Expression;
            return entry;
        }
    }
}


export interface FlatExpressionList {
    startName: string;
    flatList: Record<string, Expression>;
}


interface Entry {
    globalName: string;
    expr: Expression;
}


type Expression = ExtractNode<ResolvedProgram, 'Expression'>
type GlobalBinding = ExtractNode<ResolvedProgram, 'GlobalBinding'>;
type GlobalReferenceExpression = ExtractNode<ResolvedProgram, 'GlobalReferenceExpression'>;
type MemberExpression = ExtractNode<ResolvedProgram, 'MemberExpression'>;
type Module = ExtractNode<ResolvedProgram, 'Module'>;


function createHasher(resolve: (e: Expression) => Expression) {
    type Signature = [string, ...unknown[]];
    const signaturesByNode = new Map<Expression, Signature>();
    const hashesByNode = new Map<Expression, string>();
    return getHashFor;

    function getHashFor(ex: Expression) {
        if (hashesByNode.has(ex)) return hashesByNode.get(ex)!;
        let sig = getSignatureFor(ex);
        let hash = objectHash(sig);
        hashesByNode.set(ex, hash);
        return hash;
    }

    function getSignatureFor(ex: Expression): Signature {
        if (signaturesByNode.has(ex)) return signaturesByNode.get(ex)!;
        let e2 = resolve(ex);
        if (e2 !== ex) {
            let sig2 = getSignatureFor(e2);
            signaturesByNode.set(ex, sig2);
            return sig2;
        }
        let sig = [] as unknown as Signature;
        signaturesByNode.set(ex, sig);

        const getSig = getSignatureFor;
        const setSig = (...parts: Signature) => (sig.push(...parts), sig);

        switch (ex.kind) {
            case 'ApplicationExpression': return setSig('APP', getSig(ex.lambda), getSig(ex.argument));
            case 'BooleanLiteralExpression': return setSig('LIT', ex.value);
            case 'ExtensionExpression': return setSig('EXT', ex.extensionPath, ex.bindingName);
            case 'FieldExpression': return setSig('FLD', getSig(ex.name), getSig(ex.value));
            case 'GlobalReferenceExpression': assert(false); // the resolve() logic removed this node kind
            case 'ImportExpression': assert(false); // the resolve() logic removed this node kind
            case 'ListExpression': return setSig('LST', ex.elements.map(e => getSig(e)));
            case 'MemberExpression': return setSig('MEM', getSig(ex.module), ex.bindingName);
            case 'ModuleExpression': {
                // Ensure binding order doesn't affect signature, by building an object keyed by binding name.
                let obj = {} as Record<string, unknown>;
                for (let binding of ex.module.bindings) obj[binding.globalName] = getSig(binding.value);
                return setSig('MOD', obj);
            }
            case 'NotExpression': return setSig('NOT', getSig(ex.expression));
            case 'NullLiteralExpression': return setSig('LIT', ex.value);
            case 'NumericLiteralExpression': return setSig('LIT', ex.value);
            case 'QuantifiedExpression': return setSig('QUA', getSig(ex.expression), ex.quantifier);
            case 'RecordExpression': return setSig('REC', ex.fields.map(f => ({n: f.name, v: getSig(f.value)})));
            case 'SelectionExpression': return setSig('SEL', ex.expressions.map(e => getSig(e)));
            case 'SequenceExpression': return setSig('SEQ', ex.expressions.map(e => getSig(e)));
            case 'StringLiteralExpression': return setSig('STR', ex.value, ex.abstract, ex.concrete);
            default: ((assertNoKindsLeft: never) => { throw new Error(`Unhandled node ${assertNoKindsLeft}`); })(ex);
        }
    }
}


// TODO: jsdoc...
// - return value is *never* an LocalReferenceExpression or an ImportExpression
// - TODO: can we impl these such that the 'resolve symbol refs' transform can be removed?
function createResolver(program: ResolvedProgram, allBindings: GlobalBinding[]) {
    return resolve;

    // TODO: jsdoc...
    function resolve(expr: Expression): Expression {
        let seen = [expr];
        while (true) {
            // If `expr` is a reference or member expression, try to resolve to its target expression.
            let tgt = expr.kind === 'GlobalReferenceExpression' ? resolveReference(expr)
                : expr.kind === 'MemberExpression' ? resolveMember(expr)
                : undefined;

            // If the target expression for `expr` could not be determined, return `expr` unchanged.
            if (tgt === undefined) return expr;

            // If `expr` resolved to a target expression that isn't a Ref/Mem expression, return the target expression.
            if (tgt.kind !== 'GlobalReferenceExpression' && tgt.kind !== 'MemberExpression') return tgt;

            // If the target expression is still a Ref/Mem expression, keep iterating, but prevent an infinite loop.
            if (seen.includes(tgt)) {
                // TODO: improve diagnostic message, eg line/col ref
                let name = tgt.kind === 'GlobalReferenceExpression' ? tgt.globalName : tgt.bindingName;
                throw new Error(`'${name}' is circularly defined`);
            }
            seen.push(tgt);
            expr = tgt;
        }
    }

    /** Find the value expression referenced by `ref`. */
    function resolveReference(ref: GlobalReferenceExpression): Expression {
        let result = allBindings.find(n => n.globalName === ref.globalName);
        assert(result);
        return result.value;
    }

    /**
     * Find the value expression referenced by `module`.`bindingName`, if possible, otherwise return `undefined`.
     * Some lookups always succeed, such as when `module` is a module expression. Other lookups always fail, such
     * as when `module` is an application expression, or an import expression referencing an extension file.
     */
    function resolveMember(mem: MemberExpression): Expression | undefined {
        let moduleExpr = resolve(mem.module);
        let module: Module;
        switch (moduleExpr.kind) {
            // TODO: case 'ApplicationExpression': ...
            case 'ImportExpression': {
                module = program.sourceFiles.byAbsPath.get(moduleExpr.sourceFilePath)!;
                break;
            }
            case 'ModuleExpression': {
                module = moduleExpr.module;
                break;
            }
            default:
                return undefined;
        }

        // Do a static lookup of the expression bound to the name `bindingName` in the module `module`.
        let binding = module.bindings.find(b => b.localName === mem.bindingName);
        assert(binding);
        return binding.value;
    }
}
