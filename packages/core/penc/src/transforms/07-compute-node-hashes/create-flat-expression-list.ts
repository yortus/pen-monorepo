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
    // d. ENTRY expressions are BindingLookupExpressions



    // Create helper functions for this program.
    let {getHashFor, resolveReference, resolveMember} = createProgramHelpers(program);

    // Find the `start` expression.
    let main = program.sourceFiles.get(program.mainPath) as PenSourceFile;
    let startExpr = main.module.bindings.find(b => b.kind === 'SimpleBinding' && b.name === 'start')?.value;
    assert(startExpr);

    // TODO: temp testing...
    let hashh = getHashFor(startExpr);
    console.log(`=====>   HASH:\t${hashh}\t${startExpr.kind}`);

    let entriesByHash = new Map<string, Entry>();
    // TODO: was... restore... getEntryFor(startExpr); // NB: called for side-effect of populating `entriesByHash` map.
    [] = [getEntryFor];
    return [...entriesByHash.values()];


    // TODO: recursive...
    function getEntryFor(n: Expression): Entry {
        let hash = getHashFor(n);
        let entry = entriesByHash.get(hash)!;
        if (entry) return entry;
        entry = {uniqueName: '???', expr: undefined!};
        entriesByHash.set(hash, entry);

        // TODO: set entry.expr to a new shallow expr
        switch (n.kind) {
            case 'ApplicationExpression': return setX(n, {lambda: ref(n.lambda), argument: ref(n.argument)});
            case 'BooleanLiteralExpression': return setX(n, n);
            case 'FieldExpression': return setX(n, {name: ref(n.name), value: ref(n.value)});
            case 'ImportExpression': {
                let sf = program.sourceFiles.get(n.sourceFilePath)!;
                if (sf.kind === 'PenSourceFile') {
                    entry.expr = {kind: 'ModuleExpression', module: getModule(sf.module), meta: {}};
                    return entry;
                }
                else {
                    // TODO: expr is a ref to extension file - how??
                    throw new Error('getEntryFor(ExtensionFile): Not implemented');
                }
            }
            case 'ListExpression': return setX(n, {elements: n.elements.map(ref)});
            case 'MemberExpression': {
                let expr = resolveMember(n);
                return expr !== n ? getEnt(expr, false) : setX(n, {module: ref(n.module), bindingName: n.bindingName});
            }
            case 'ModuleExpression': return setX(n, {module: getModule(n.module)});
            case 'NotExpression': return setX(n, {expression: ref(n.expression)});
            case 'NullLiteralExpression': return setX(n, n);
            case 'NumericLiteralExpression': return setX(n, n);
            case 'ParenthesisedExpression': assert(false); // the 'desugar-syntax' transform removed this node kind
            case 'QuantifiedExpression': return setX(n, {expression: ref(n.expression), quantifier: n.quantifier});
            case 'RecordExpression': return setX(n, {fields: n.fields.map(f => ({name: f.name, value: ref(f.value)}))});
            case 'ReferenceExpression': return getEnt(resolveReference(n));
            case 'SelectionExpression': return setX(n, {expressions: n.expressions.map(ref)});
            case 'SequenceExpression': return setX(n, {expressions: n.expressions.map(ref)});
            case 'StringLiteralExpression': return setX(n, n);
            default: ((assertNoKindsLeft: never) => { throw new Error(`Unhandled node ${assertNoKindsLeft}`); })(n);
        }

        function getEnt(expr: Expression, allowCircularity = true) {
            let result = getEntryFor(expr);
            if (result === entry && !allowCircularity) {
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

        function ref(expr: Expression): AstNodes.ReferenceExpression<any> {
            return {kind: 'ReferenceExpression', name: getEntryFor(expr).uniqueName, meta: {}};
        }

        function setX<E extends AstNodes.Expression>(expr: E, vals: Omit<E, 'kind' | 'meta'>) {
            entry.expr = {kind: expr.kind, ...vals, meta: {}} as any;
            return entry;
        }

        function getModule(module: Module): Module {
            let bindings = module.bindings.map(binding => {
                assert(binding.kind === 'SimpleBinding');
                return {...binding, value: ref(binding.value)} as SimpleBinding;
            });
            return {...module, bindings};
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
type PenSourceFile = AstNodes.PenSourceFile<Metadata>;
type Program = AstNodes.Program<Metadata>;
type ReferenceExpression = AstNodes.ReferenceExpression<Metadata>;
type SimpleBinding = AstNodes.SimpleBinding<Metadata>;


function createProgramHelpers(program: Program) {
    type Signature = [string, ...unknown[]];
    const allBindings = [] as SimpleBinding[];
    const signaturesByNode = new Map<Expression, Signature>();
    const hashesByNode = new Map<Expression, string>();
    const {resolveMember, resolveReference} = createLookupHelpers(program);
    traverseDepthFirst(program, n => n.kind === 'SimpleBinding' ? allBindings.push(n) : 0);
    return {getHashFor, resolveReference, resolveMember};

    function getHashFor(expr: Expression) {
        if (hashesByNode.has(expr)) return hashesByNode.get(expr)!;
        let sig = getSignatureFor(expr);
        let hash = objectHash(sig);
        hashesByNode.set(expr, hash);
        return hash;
    }

    function getSignatureFor(n: Expression): Signature {
        if (signaturesByNode.has(n)) return signaturesByNode.get(n)!;
        let sig = [] as unknown as Signature;
        signaturesByNode.set(n, sig);
        switch (n.kind) {
            case 'ApplicationExpression': return setSig('APP', getSig(n.lambda), getSig(n.argument));
            case 'BooleanLiteralExpression': return setSig('LIT', n.value);
            case 'FieldExpression': return setSig('FLD', getSig(n.name), getSig(n.value));
            case 'ImportExpression': {
                let sf = program.sourceFiles.get(n.sourceFilePath)!;
                return sf.kind === 'PenSourceFile' ? setModuleSig(sf.module) : setSig('EXF', sf.path);
            }
            case 'ListExpression': return setSig('LST', n.elements.map(e => getSig(e)));
            case 'MemberExpression': {
                let expr = resolveMember(n);
                return expr !== n ? getSig(expr, false) : setSig('MEM', getSig(n.module), n.bindingName);
            }
            case 'ModuleExpression': return setModuleSig(n.module);
            case 'NotExpression': return setSig('NOT', getSig(n.expression));
            case 'NullLiteralExpression': return setSig('LIT', n.value);
            case 'NumericLiteralExpression': return setSig('LIT', n.value);
            case 'ParenthesisedExpression': assert(false); // the 'desugar-syntax' transform removed this node kind
            case 'QuantifiedExpression': return setSig('QUA', getSig(n.expression), n.quantifier);
            case 'RecordExpression': return setSig('REC', n.fields.map(f => ({n: f.name, v: getSig(f.value)})));
            case 'ReferenceExpression': return getSig(resolveReference(n), false);
            case 'SelectionExpression': return setSig('SEL', n.expressions.map(e => getSig(e)));
            case 'SequenceExpression': return setSig('SEQ', n.expressions.map(e => getSig(e)));
            case 'StringLiteralExpression': return setSig('STR', n.value, n.abstract, n.concrete);
            default: ((assertNoKindsLeft: never) => { throw new Error(`Unhandled node ${assertNoKindsLeft}`); })(n);
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

        function setSig(...els: Signature) {
            sig.push(...els);
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
function createLookupHelpers(program: Program) {
    const allBindings = [] as SimpleBinding[];
    traverseDepthFirst(program, n => n.kind === 'SimpleBinding' ? allBindings.push(n) : 0);
    return {resolveReference, resolveMember};

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
    function resolveMember(mem: MemberExpression): Expression {
        switch (mem.module.kind) {
            case 'ApplicationExpression': {
                // TODO: don't know how to do this static lookup *yet*...
                return mem;
            }
            case 'ImportExpression': {
                let sourceFile = program.sourceFiles.get(mem.module.sourceFilePath)!;
                if (sourceFile.kind === 'PenSourceFile') {
                    return staticModuleLookup(sourceFile.module, mem.bindingName);
                }
                else /* sourceFile.kind === 'ExtensionFile' */ {
                    // Can't simplify bindings within extension files.
                    // TODO: why not? We can make one 'entry' per extfile binding, we know the names statically...
                    return mem;
                }
            }
            case 'MemberExpression': {
                // Try simplifying the lhs and recursing.
                let module = resolveMember(mem.module);
                if (module === mem.module) return mem;
                return resolveMember({...mem, module});
            }
            case 'ModuleExpression': {
                return staticModuleLookup(mem.module.module, mem.bindingName);
            }
            case 'ReferenceExpression': {
                // Try simplifying the lhs and recursing.
                let module = resolveReference(mem.module);
                return resolveMember({...mem, module});
            }
            default:
                return mem;
        }
    }

    /** Do a static lookup of the expression bound to the name `bindingName` in the module `mod`. */
    function staticModuleLookup(mod: Module, bindingName: string): Expression {
        let binding = mod.bindings.find(b => b.kind === 'SimpleBinding' && b.name === bindingName);
        assert(binding && binding.kind === 'SimpleBinding');
        return binding.value;
    }
}
