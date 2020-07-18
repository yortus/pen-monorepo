// TODO: error on unreferenced non-exported bindings. Need to impl exports properly first...


import * as objectHash from 'object-hash';
import * as AstNodes from '../../ast-nodes';
import {assert, traverseDepthFirst} from '../../utils';
import {Metadata} from './metadata';


// TODO: doc...
export function createFlatExpressionList(program: Program): Entry[] {


    // Objectives:
    // 1. generate an ENTRY for the `start` reference
    // 2. in the process of (1), generate an ENTRY for every sub-expression required to generate the `start` ENTRY.

    // ENTRY rules:
    // a. the expression in an ENTRY is always 'flat' - any subexpressions are ReferenceExpressions to other ENTRYs
    // b. each ENTRY has a unique name (to facilitate rule (a)). Can be human-readable / linked to source names
    // c. ENTRY expressions are never ReferenceExpressions - these are always resolved before creating entries
    // d. ENTRY expressions *may be* MemberExpressions, if they cannot be resolved

    // Method:
    // 1. start with the `start` reference
    // 2. tryResolve the expression (so can't be a ReferenceExpression after this)
    // 3. Q: have we already computed an entry for this expression or its equivalent?
    //    3.1. compute the hash of the expression
    //    3.2. lookup the hash in the map of already computed entries
    // 4. IF YES: return the already computed entry. STOP
    // 5. clone the expression, but with each direct subexpr replaced as follows:
    //    5.1. recursively compute the entry for the subexpr
    //    5.2. create a ReferenceExpression referring to the entry just computed
    //    5.3. use the ReferenceExpression as the replacement for the subexpr
    // 6. generate a unique name for the entry (may be based on names in source code)
    // 7. construct an entry with the unique name and cloned expression
    // 8. add the entry to the map of already computed entries, keyed by hash
    // 9. return the entry.

    // Implementation:
    // function getEntryFor(e: Expression): Expression<M2>;
    // function getSignatureFor(e: Expression): Signature;
    // function resolve(e: Expression): Expression;










    // Create helper functions for this program.
    let resolve = createResolver(program);
    let getHashFor = createHasher(program, resolve);

    // Find the `start` expression.
    let main = program.sourceFiles.get(program.mainPath) as PenSourceFile;
    let startExpr = main.module.bindings.find(b => b.kind === 'SimpleBinding' && b.name === 'start')?.value;
    assert(startExpr);

    // TODO: temp testing...
    let startHash = getHashFor(startExpr);
    console.log(`=====>   HASH:\t${startHash}\t${startExpr.kind}`);

    const BLANK_ENTRY: Entry = {uniqueName: '???', expr: undefined!};
    let entriesByHash = new Map<string, Entry>();
    let startEntry = getEntryFor(startExpr); // NB: called for side-effect of populating `entriesByHash` map.
    [] = [startEntry];
    return [...entriesByHash.values()];


    // TODO: recursive...
    function getEntryFor(e: Expression): Entry {
        if (1 + 1 === 2) return null!;
        e = resolve(e);
        let hash = getHashFor(e);
        let entry = entriesByHash.get(hash);
        if (entry) return entry;
        entry = {...BLANK_ENTRY};
        entriesByHash.set(hash, entry);

        let e2: AstNodes.Expression | undefined;
        switch (e.kind) {
            case 'ApplicationExpression': e2 = clone(e, {lambda: ref(e.lambda), argument: ref(e.argument)}); break;
            case 'BooleanLiteralExpression': e2 = e; break;
            case 'FieldExpression': e2 = clone(e, {name: ref(e.name), value: ref(e.value)}); break;

            case 'ImportExpression': throw new Error('Not implemented'); // ==========   TODO   ==========

            case 'ListExpression': e2 = clone(e, {elements: e.elements.map(ref)}); break;
            case 'MemberExpression': e2 = clone(e, {module: ref(e.module), bindingName: e.bindingName}); break;

            case 'ModuleExpression': throw new Error('Not implemented'); // ==========   TODO   ==========

            case 'NotExpression': e2 = clone(e, {expression: ref(e.expression)}); break;
            case 'NullLiteralExpression': e2 = e; break;
            case 'NumericLiteralExpression': e2 = e; break;
            case 'ParenthesisedExpression': assert(false); // the 'desugar-syntax' transform removed this node kind
            case 'QuantifiedExpression': e2 = clone(e, {expression: ref(e.expression), quantifier: e.quantifier}); break;
            case 'RecordExpression': e2 = clone(e, {fields: e.fields.map(f => ({name: f.name, value: ref(f.value)}))}); break;
            case 'ReferenceExpression': assert(false); // the resolve() call removed this node kind
            case 'SelectionExpression': e2 = clone(e, {expressions: e.expressions.map(ref)}); break;
            case 'SequenceExpression': e2 = clone(e, {expressions: e.expressions.map(ref)}); break;
            case 'StringLiteralExpression': e2 = e; break;
            default: ((assertNoKindsLeft: never) => { throw new Error(`Unhandled node ${assertNoKindsLeft}`); })(e);
        }

        // TODO: ...
        [] = [e2];
        return null!;




        // TODO: was...
        // let hash = getHashFor(e);
        // let entry = entriesByHash.get(hash)!;
        // if (entry) return entry;
        // entry = {uniqueName: '???', expr: undefined!};
        // entriesByHash.set(hash, entry);

/*
        // TODO: set entry.expr to a new shallow expr
        switch (e.kind) {
            case 'ApplicationExpression': return setX(e, {lambda: ref(e.lambda), argument: ref(e.argument)});
            case 'BooleanLiteralExpression': return setX(e, e);
            case 'FieldExpression': return setX(e, {name: ref(e.name), value: ref(e.value)});
            case 'ImportExpression': {
                let sf = program.sourceFiles.get(e.sourceFilePath)!;
                if (sf.kind === 'PenSourceFile') {
                    entry.expr = {kind: 'ModuleExpression', module: getModule(sf.module), meta: {}};
                    return entry;
                }
                else {
                    // TODO: expr is a ref to extension file - how??
                    throw new Error('getEntryFor(ExtensionFile): Not implemented');
                }
            }
            case 'ListExpression': return setX(e, {elements: e.elements.map(ref)});
            case 'MemberExpression': {
                let expr = tryResolve(e);
                return expr !== e ? getEnt(expr, false) : setX(e, {module: ref(e.module), bindingName: e.bindingName});
            }
            case 'ModuleExpression': return setX(e, {module: getModule(e.module)});
            case 'NotExpression': return setX(e, {expression: ref(e.expression)});
            case 'NullLiteralExpression': return setX(e, e);
            case 'NumericLiteralExpression': return setX(e, e);
            case 'ParenthesisedExpression': assert(false); // the 'desugar-syntax' transform removed this node kind
            case 'QuantifiedExpression': return setX(e, {expression: ref(e.expression), quantifier: e.quantifier});
            case 'RecordExpression': return setX(e, {fields: e.fields.map(f => ({name: f.name, value: ref(f.value)}))});
            case 'ReferenceExpression': return getEnt(tryResolve(e));
            case 'SelectionExpression': return setX(e, {expressions: e.expressions.map(ref)});
            case 'SequenceExpression': return setX(e, {expressions: e.expressions.map(ref)});
            case 'StringLiteralExpression': return setX(e, e);
            default: ((assertNoKindsLeft: never) => { throw new Error(`Unhandled node ${assertNoKindsLeft}`); })(e);
        }
*/

        // function getEnt(expr: Expression, allowCircularity = true) {
        //     let result = getEntryFor(expr);
        //     if (result === entry && !allowCircularity) {
        //         // TODO: room for improvement with this error message, and how it is constructed
        //         let name
        //             = expr.kind === 'ReferenceExpression' ? expr.name
        //             : expr.kind === 'MemberExpression' ? expr.bindingName
        //             : '';
        //         assert(name);
        //         throw new Error(`'${name}' is circularly defined`);
        //     }
        //     return result;
        // }

        function ref(expr: Expression): AstNodes.ReferenceExpression<any> {
            return {kind: 'ReferenceExpression', name: getEntryFor(expr).uniqueName, meta: {}};
        }

        function clone<E extends AstNodes.Expression>(expr: E, vals: Omit<E, 'kind' | 'meta'>) {
            return {kind: expr.kind, ...vals, meta: {}} as unknown as AstNodes.Expression;
        }

        // function getModule(module: Module): Module {
        //     let bindings = module.bindings.map(binding => {
        //         assert(binding.kind === 'SimpleBinding');
        //         return {...binding, value: ref(binding.value)} as SimpleBinding;
        //     });
        //     return {...module, bindings};
        // }
    }
}


export interface Entry {
    uniqueName: string;
    expr: AstNodes.Expression;
}


type Expression = AstNodes.Expression<Metadata>;
type MemberExpression = AstNodes.MemberExpression<Metadata>;
type Module = AstNodes.Module<Metadata>;
type PenSourceFile = AstNodes.PenSourceFile<Metadata>;
type Program = AstNodes.Program<Metadata>;
type ReferenceExpression = AstNodes.ReferenceExpression<Metadata>;
type SimpleBinding = AstNodes.SimpleBinding<Metadata>;


function createHasher(program: Program, resolve: (e: Expression) => Expression) {
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
        let sig = [] as unknown as Signature;
        signaturesByNode.set(ex, sig);
        switch (ex.kind) {
            case 'ApplicationExpression': return setSig('APP', getSig(ex.lambda), getSig(ex.argument));
            case 'BooleanLiteralExpression': return setSig('LIT', ex.value);
            case 'FieldExpression': return setSig('FLD', getSig(ex.name), getSig(ex.value));
            case 'ImportExpression': {
                let sf = program.sourceFiles.get(ex.sourceFilePath)!;
                return sf.kind === 'PenSourceFile' ? setModuleSig(sf.module) : setSig('EXF', sf.path);
            }
            case 'ListExpression': return setSig('LST', ex.elements.map(e => getSig(e)));
            case 'MemberExpression': {
                let expr = resolve(ex);
                return expr !== ex ? getSig(expr, false) : setSig('MEM', getSig(ex.module), ex.bindingName);
            }
            case 'ModuleExpression': return setModuleSig(ex.module);
            case 'NotExpression': return setSig('NOT', getSig(ex.expression));
            case 'NullLiteralExpression': return setSig('LIT', ex.value);
            case 'NumericLiteralExpression': return setSig('LIT', ex.value);
            case 'ParenthesisedExpression': assert(false); // the 'desugar-syntax' transform removed this node kind
            case 'QuantifiedExpression': return setSig('QUA', getSig(ex.expression), ex.quantifier);
            case 'RecordExpression': return setSig('REC', ex.fields.map(f => ({n: f.name, v: getSig(f.value)})));
            case 'ReferenceExpression': return getSig(resolve(ex), false);
            case 'SelectionExpression': return setSig('SEL', ex.expressions.map(e => getSig(e)));
            case 'SequenceExpression': return setSig('SEQ', ex.expressions.map(e => getSig(e)));
            case 'StringLiteralExpression': return setSig('STR', ex.value, ex.abstract, ex.concrete);
            default: ((assertNoKindsLeft: never) => { throw new Error(`Unhandled node ${assertNoKindsLeft}`); })(ex);
        }

        function getSig(expr: Expression, allowCircularity = true) {
            let result = getSignatureFor(expr);
            if (result === sig && !allowCircularity) {
                // TODO: room for improvement with this error message, and how it is constructed
                let name
                    = expr.kind === 'ReferenceExpression' ? expr.name
                    : expr.kind === 'MemberExpression' ? expr.bindingName
                    : '';
                assert(name);
                throw new Error(`'${name}' is circularly defined`);
            }
            return result;
        }

        function setSig(...parts: Signature) {
            sig.push(...parts);
            return sig;
        }

        function setModuleSig(module: Module): Signature {
            // Make an object keyed by binding name, to ensure binding order doesn't affect signature.
            let obj = {} as Record<string, unknown>;
            for (let binding of module.bindings) {
                assert(binding.kind === 'SimpleBinding');
                obj[binding.name] = getSig(binding.value);
            }
            sig.push('MOD', obj);
            return sig;
        }
    }
}












// TODO: jsdoc...
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
                if (sourceFile.kind === 'PenSourceFile') {
                    module = sourceFile.module;
                    break;
                }
                else /* sourceFile.kind === 'ExtensionFile' */ {
                    // Can't simplify bindings within extension files.
                    // TODO: why not? We can make one 'entry' per extfile binding, we know the names statically...
                    return undefined;
                }
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
