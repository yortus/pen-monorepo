// TODO: error on unreferenced non-exported bindings. Need to impl exports properly first...


import * as objectHash from 'object-hash';
import * as AstNodes from '../../ast-nodes';
import {assert, traverseDepthFirst} from '../../utils';
import {Metadata} from './metadata';


// TODO: jsdoc...
export function createFlatExpressionList(program: Program): Record<string, AstNodes.Expression> {

    // ENTRY rules:
    // a. the expression in an ENTRY is always 'flat' - any subexpressions are ReferenceExpressions to other ENTRYs
    // b. each ENTRY has a unique name (to facilitate rule (a)). Can be human-readable / linked to source names
    // c. ENTRY expressions are never ReferenceExpressions - these are always resolved before creating entries
    // d. ENTRY expressions *may be* MemberExpressions, if they cannot be resolved

    // Create helper functions for this program.
    let resolve = createResolver(program);
    let getHashFor = createHasher(resolve);

    // Find the `start` expression.
    let main = program.sourceFiles.get(program.mainPath)!;
    let startExpr = main.module.bindings.find(b => b.kind === 'SimpleBinding' && b.name === 'start')?.value;
    assert(startExpr);

    let entriesByHash = new Map<string, Entry>();
    let counter = 0;
    getEntryFor(startExpr); // NB: called for side-effect of populating `entriesByHash` map.

    // TODO: temp testing... build the one and only internal module for emitting
    let flatList = {} as Record<string, AstNodes.Expression>;
    for (let {uniqueName, expr} of entriesByHash.values()) flatList[uniqueName] = expr;
    return flatList;


    // TODO: recursive...
    function getEntryFor(e: Expression): Entry {
        e = resolve(e);
        let hash = getHashFor(e);
        if (entriesByHash.has(hash)) return entriesByHash.get(hash)!;
        let entry: Entry = {uniqueName: `id${++counter}`, expr: undefined!};
        entriesByHash.set(hash, entry);

        // Set `entry.expr` to a new shallow expr, and return `entry`.
        switch (e.kind) {
            case 'ApplicationExpression': return setX(e, {lambda: ref(e.lambda), argument: ref(e.argument)});
            case 'BooleanLiteralExpression': return setX(e);
            case 'ExtensionExpression': return setX(e);
            case 'FieldExpression': return setX(e, {name: ref(e.name), value: ref(e.value)});
            case 'ImportExpression': assert(false); // the resolve() call removed this node kind
            case 'ListExpression': return setX(e, {elements: e.elements.map(ref)});
            case 'MemberExpression': return setX(e, {module: ref(e.module), bindingName: e.bindingName});
            case 'ModuleExpression': {
                let bindings = e.module.bindings.map(binding => {
                    assert(binding.kind === 'SimpleBinding');
                    return {...binding, value: ref(binding.value), meta: {}} as SimpleBinding;
                });
                return setX(e, {module: {kind: 'Module', bindings, meta: {} as any}});
            }
            case 'NotExpression': return setX(e, {expression: ref(e.expression)});
            case 'NullLiteralExpression': return setX(e);
            case 'NumericLiteralExpression': return setX(e);
            case 'ParenthesisedExpression': assert(false); // the 'desugar-syntax' transform removed this node kind
            case 'QuantifiedExpression': return setX(e, {expression: ref(e.expression), quantifier: e.quantifier});
            case 'RecordExpression': return setX(e, {fields: e.fields.map(f => ({name: f.name, value: ref(f.value)}))});
            case 'ReferenceExpression': assert(false); // the resolve() call removed this node kind
            case 'SelectionExpression': return setX(e, {expressions: e.expressions.map(ref)});
            case 'SequenceExpression': return setX(e, {expressions: e.expressions.map(ref)});
            case 'StringLiteralExpression': return setX(e);
            default: ((assertNoKindsLeft: never) => { throw new Error(`Unhandled node ${assertNoKindsLeft}`); })(e);
        }

        function ref(expr: Expression): AstNodes.ReferenceExpression<any> {
            return {kind: 'ReferenceExpression', name: getEntryFor(expr).uniqueName, meta: {}};
        }

        function setX<E extends AstNodes.Expression>(expr: E, vals?: Omit<E, 'kind' | 'meta'>) {
            entry.expr = Object.assign({kind: expr.kind}, vals || expr, {meta: {}}) as unknown as AstNodes.Expression;
            return entry;
        }
    }
}


export interface Entry {
    uniqueName: string;
    expr: AstNodes.Expression;
}


type Expression = AstNodes.Expression<Metadata>;
type MemberExpression = AstNodes.MemberExpression<Metadata>;
type Module = AstNodes.Module<Metadata>;
type Program = AstNodes.Program<Metadata>;
type ReferenceExpression = AstNodes.ReferenceExpression<Metadata>;
type SimpleBinding = AstNodes.SimpleBinding<Metadata>;


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
            case 'ImportExpression': assert(false); // the resolve() logic removed this node kind
            case 'ListExpression': return setSig('LST', ex.elements.map(e => getSig(e)));
            case 'MemberExpression': return setSig('MEM', getSig(ex.module), ex.bindingName);
            case 'ModuleExpression': {
                // Ensure binding order doesn't affect signature, by building an object keyed by binding name.
                let obj = {} as Record<string, unknown>;
                for (let binding of ex.module.bindings) {
                    assert(binding.kind === 'SimpleBinding');
                    obj[binding.name] = getSig(binding.value);
                }
                return setSig('MOD', obj);
            }
            case 'NotExpression': return setSig('NOT', getSig(ex.expression));
            case 'NullLiteralExpression': return setSig('LIT', ex.value);
            case 'NumericLiteralExpression': return setSig('LIT', ex.value);
            case 'ParenthesisedExpression': assert(false); // the 'desugar-syntax' transform removed this node kind
            case 'QuantifiedExpression': return setSig('QUA', getSig(ex.expression), ex.quantifier);
            case 'RecordExpression': return setSig('REC', ex.fields.map(f => ({n: f.name, v: getSig(f.value)})));
            case 'ReferenceExpression': assert(false); // the resolve() logic removed this node kind
            case 'SelectionExpression': return setSig('SEL', ex.expressions.map(e => getSig(e)));
            case 'SequenceExpression': return setSig('SEQ', ex.expressions.map(e => getSig(e)));
            case 'StringLiteralExpression': return setSig('STR', ex.value, ex.abstract, ex.concrete);
            default: ((assertNoKindsLeft: never) => { throw new Error(`Unhandled node ${assertNoKindsLeft}`); })(ex);
        }
    }
}


// TODO: jsdoc...
// - return value is *never* a ReferenceExpression or ImportExpression
// - TODO: can we impl these such that the 'resolve symbol refs' transform can be removed?
function createResolver(program: Program) {
    const allBindings = [] as SimpleBinding[];
    traverseDepthFirst(program, n => n.kind === 'SimpleBinding' ? allBindings.push(n) : 0);
    return resolve;

    // TODO: jsdoc...
    function resolve(expr: Expression): Expression {
        let seen = [expr];
        while (true) {
            // If `expr` is a reference or member expression, try to resolve to its target expression.
            let tgt = expr.kind === 'ReferenceExpression' ? resolveReference(expr)
                : expr.kind === 'MemberExpression' ? resolveMember(expr)
                : undefined;

            // If the target expression for `expr` could not be determined, return `expr` unchanged.
            if (tgt === undefined) return expr;

            // If `expr` resolved to a target expression that isn't a Ref/Mem expression, return the target expression.
            if (tgt.kind !== 'ReferenceExpression' && tgt.kind !== 'MemberExpression') return tgt;

            // If the target expression is still a Ref/Mem expression, keep iterating, but prevent an infinite loop.
            if (seen.includes(tgt)) {
                // TODO: improve diagnostic message, eg line/col ref
                let name = tgt.kind === 'ReferenceExpression' ? tgt.name : tgt.bindingName;
                throw new Error(`'${name}' is circularly defined`);
            }
            seen.push(tgt);
            expr = tgt;
        }
    }

    /** Find the value expression referenced by `ref`. */
    function resolveReference(ref: ReferenceExpression): Expression {
        let symbolId = ref.meta.symbolId;
        let result = allBindings.find(n => n.meta.symbolId === symbolId);
        assert(result && result.kind === 'SimpleBinding');
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
                let sourceFile = program.sourceFiles.get(moduleExpr.sourceFilePath)!;
                module = sourceFile.module;
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
        let binding = module.bindings.find(b => b.kind === 'SimpleBinding' && b.name === mem.bindingName);
        assert(binding && binding.kind === 'SimpleBinding');
        return binding.value;
    }
}
