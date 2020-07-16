// TODO: error on unreferenced non-exported bindings. Need to impl exports properly first...


import * as objectHash from 'object-hash';
import * as AstNodes from '../../ast-nodes';
import {assert, traverseDepthFirst} from '../../utils';
import {Metadata} from './metadata';


// TODO: doc...
export function createFlatExpressionList(program: Program) {

    // Create helper functions for this program.
    let getHashFor = createExpressionHasher(program);

    // Find the `start` expression.
    let main = program.sourceFiles.get(program.mainPath) as PenSourceFile;
    let startExpr = main.module.bindings.find(b => b.kind === 'SimpleBinding' && b.name === 'start')?.value;
    assert(startExpr);


    let entry = getEntryFor(startExpr);
    [] = [entry];



    return program;

    // TODO: recursive...
    function getEntryFor(expr: Expression): Entry {
        let hash = getHashFor(expr);
        [] = [hash];

        // Steps:
        // 1. If an equivelent entry already exists, do nothing else and return the existing entry
        //    1a. compute the hash code for `expr`.
        //    1b. search for an existing entry with the same hash code. If found, regard it as an equivelent entry.
        // 2. 

        switch (expr.kind) {
            case 'BooleanLiteralExpression':
            case 'FieldExpression':
            case 'ImportExpression':
            case 'ListExpression':
            case 'MemberExpression':
            case 'ModuleExpression':
            case 'NotExpression':
            case 'NullLiteralExpression':
            case 'NumericLiteralExpression':
            case 'ParenthesisedExpression': // will never happen
            case 'QuantifiedExpression':
            case 'RecordExpression':
            case 'ReferenceExpression':
            case 'SelectionExpression':
            case 'SequenceExpression':
            case 'StringLiteralExpression':
                break;
            default:
                // TODO: exhaustiveness check
        }

        // TODO: ...
        return null!;
    }
}


export interface Entry {
    name: string;
    expr: AstNodes.Expression;
}


type Expression = AstNodes.Expression<Metadata>;
type Module = AstNodes.Module<Metadata>;
type PenSourceFile = AstNodes.PenSourceFile<Metadata>;
type Program = AstNodes.Program<Metadata>;
type ReferenceExpression = AstNodes.ReferenceExpression<Metadata>;
type SimpleBinding = AstNodes.SimpleBinding<Metadata>;


function createExpressionHasher(program: Program) {
    type Signature = [string, ...unknown[]];
    const allBindings = [] as SimpleBinding[];
    const signaturesByNode = new Map<Expression, Signature>();
    const hashesByNode = new Map<Expression, string>();
    traverseDepthFirst(program, n => n.kind === 'SimpleBinding' ? allBindings.push(n) : 0);

    return function getHashFor(expr: Expression) {
        if (hashesByNode.has(expr)) return hashesByNode.get(expr)!;
        let sig = getSignatureFor(expr);
        let hash = objectHash(sig);
        hashesByNode.set(expr, hash);
        return hash;
    };

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
                let expr = tryStaticBindingLookup(n.module, n.bindingName);
                return expr ? getSig(expr, false) : setSig('BLE', getSig(n.module), n.bindingName);
            }
            case 'ModuleExpression': return setModuleSig(n.module);
            case 'NotExpression': return setSig('NOT', getSig(n.expression));
            case 'NullLiteralExpression': return setSig('LIT', n.value);
            case 'NumericLiteralExpression': return setSig('LIT', n.value);
            case 'ParenthesisedExpression': assert(false); // the 'desugar-syntax' transform removed this node kind
            case 'QuantifiedExpression': return setSig('QUA', getSig(n.expression), n.quantifier);
            case 'RecordExpression': return setSig('REC', n.fields.map(f => ({n: f.name, v: getSig(f.value)})));
            case 'ReferenceExpression': return getSig(findReferencedExpression(n), false);
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

    function findReferencedExpression(ref: ReferenceExpression): Expression {
        let symbolId = ref.meta.symbolId;
        let result = allBindings.find(n => n.meta.symbolId === symbolId);
        assert(result && result.kind === 'SimpleBinding');
        return result.value;
    }

    function tryStaticBindingLookup(module: Expression, bindingName: string): Expression | undefined {
        let lhs: Expression | undefined;
        switch (module.kind) {
            case 'ApplicationExpression': {
                // TODO: don't know how to do this static lookup *yet*...
                return undefined;
            }
            case 'ImportExpression': {
                let sourceFile = program.sourceFiles.get(module.sourceFilePath)!;
                if (sourceFile.kind === 'PenSourceFile') {
                    return staticModuleLookup(sourceFile.module);
                }
                else /* sourceFile.kind === 'ExtensionFile' */ {
                    // Can't simplify bindings within extension files.
                    // TODO: why not? We can make one 'entry' per extfile binding, we know the names statically...
                    return undefined;
                }
            }
            case 'MemberExpression': {
                // Try simplifying the lhs and recursing.
                lhs = tryStaticBindingLookup(module.module, module.bindingName);
                return lhs ? tryStaticBindingLookup(lhs, bindingName) : undefined;
            }
            case 'ModuleExpression': {
                return staticModuleLookup(module.module);
            }
            case 'ReferenceExpression': {
                // Try simplifying the lhs and recursing.
                lhs = findReferencedExpression(module);
                return lhs ? tryStaticBindingLookup(lhs, bindingName) : undefined;
            }
        }

        function staticModuleLookup(mod: Module): Expression {
            // Do a static lookup in of the expression bound to the name `bindingName` in the module `mod`.
            let binding = mod.bindings.find(b => b.kind === 'SimpleBinding' && b.name === bindingName);
            assert(binding && binding.kind === 'SimpleBinding');
            return binding.value;
        }
    }
}
