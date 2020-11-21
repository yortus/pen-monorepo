import {Definition, Expression, mapNode, MemberExpression, Module, Reference, traverseNode} from '../../abstract-syntax-trees';
import {DefinitionMap, definitionMapKinds, ModuleMap} from '../../representations';
import {assert} from '../../utils';


// TODO: doc... after this transform, the following node kinds will no longer be present anywhere in the AST:
// - LocalMultiBinding
export function createDefinitionMap({modulesById}: ModuleMap): DefinitionMap {
    type Scope = Record<string, Definition | undefined>;
    let scopesByModuleId = new Map<string, Scope>();
    let definitions = [] as Definition[];
    let references = [] as {name: string, moduleId: string, ref: Reference}[];

    // Define all modules in the root scope.
    const ROOT_MODULE_ID = '@@root'; // TODO: ensure can never clash with any identifier name or moduleId
    const rootScope: Scope = Object.create(null);
    scopesByModuleId.set(ROOT_MODULE_ID, rootScope);
    for (const module of Object.values(modulesById)) {
        const definition: Definition = {
            kind: 'Definition',
            definitionId: definitions.length,
            moduleId: ROOT_MODULE_ID,
            localName: module.moduleId,
            value: {kind: 'Module', moduleId: module.moduleId} as Module, // TODO: yukky lie in type system - but full ast not needed here - how to fix?
        };
        definitions.push(definition);
        rootScope[module.moduleId] = definition;
    }

    // Helper function to add a definition for `name` into the given module's scope.
    function define(name: string, moduleId: string, value: Expression | Module): Definition {
        console.log(`    DEF ${name}`);
        let scope = scopesByModuleId.get(moduleId);
        assert(scope); // sanity check
        if (Object.keys(scope).includes(name)) {
            throw new Error(`'${name}' is already defined`); // TODO: improve diagnostic message eg line+col
        }
        let definition: Definition = {
            kind: 'Definition',
            definitionId: definitions.length,
            moduleId,
            localName: name,
            // TODO: ...globalName: undefined!, // TODO
            value,
        };
        definitions.push(definition);
        scope[name] = definition;
        return definition;
    }

    // TODO: ...
    function lookup(name: string, moduleId: string): Definition {
        const scope = scopesByModuleId.get(moduleId);
        assert(scope); // sanity check
        let definition = scope[name];
        if (!definition) {
            throw new Error(`'${name}' is not defined`); // TODO: improve diagnostic message eg line+col
        }
        return definition;
    }

    // Traverse each module, creating a scope for the module, and one or more definitions for each binding.
    for (let {moduleId, parentModuleId, bindings} of Object.values(modulesById)) {
        let parentScope = parentModuleId ? scopesByModuleId.get(parentModuleId) : rootScope;
        assert(parentScope); // TODO: sanity check - relies on specific order of modules in module map - fix this

        // Create a scope for the module.
        let scope = Object.create(parentScope);
        scopesByModuleId.set(moduleId, scope);

        // Create a definition for each local name in the module.
        for (let {left, right} of bindings) {
            // For a simple `name = value` binding, create a single definition.
            if (left.kind === 'Identifier') {
                define(left.name, moduleId, right);
            }

            // For a destructured `{a, b} = module` binding, create a definition for each name in the lhs.
            else /* left.kind === 'ModulePattern' */ {
                for (let {name, alias} of left.names) {
                    let expr: MemberExpression = {
                        kind: 'MemberExpression',
                        module: right,
                        member: {kind: 'Identifier', name},
                    };
                    define(alias ?? name, moduleId, expr);
                }
            }
        }
    }




    // TODO: ...
    // Traverse the expression for each definition:
    // - resolve Identifier to Reference
    //   - just do a 'lookup'
    //   - but need to loop, since lookup result itself may refer to an Identifier or MemberExpression
    //   - also need to prevent infinite loop by remembering what defns have already been visited and never revisiting
    //     - eg a = b   b = c   c = a
    // - resolve MemberExpression to Reference
    //   - form: `module`.`member`
    //   - Q: what expr kinds can `module` potentially be before resolution?
    //     - Identifier like '@std' referring directly to a Module
    //     - Identifier like 'mod1' referring to a definition
    //     - MemberExpression, like `a.b` in `a.b.c`
    //     - ApplicationExpression, like `foo()` in `foo().bar`
    //       - just disallow this for now (produce an error) and come back to it later
    //     - *nothing* else would ever be valid - not even ModuleExpression since they are no longer in the AST
    //   - call self to 'resolve' the `module` expression
    //   - once resolved, assert that the `module` expression is a module
    //     - how/what exactly?
    //   - just do a lookup of the `member` name in the `module` expression
    //   - but need to loop, since lookup result itself may refer to an Identifier or MemberExpression
    //   - also need to prevent infinite loop by remembering what defns have already been visited and never revisiting
    //     - eg a = {b = a.b}
    // - (leave parens alone in this transform)


    // Resolve all Identifier nodes (except MemberExpression#member - that is resolved next)
    for (let def of definitions) {
        // TODO: messy special treatment of 'module' defns... cleaner way?
        if (def.value.kind === 'Module') continue;

        const newValue = mapNode(def.value, rec => ({
            Identifier: ({name}): Reference => {
                const {definitionId} = lookup(name, def.moduleId);
                return {kind: 'Reference', definitionId};
            },
            MemberExpression: mem => {
                const memᐟ = {...mem, module: rec(mem.module)};
                return memᐟ;
            },
        }));
        Object.assign(def, {value: newValue}); // TODO: messy overwrite of readonly prop - better/cleaner way?
    }

    // Resolve all MemberExpression nodes
    for (let def of definitions) {
        // TODO: messy special treatment of 'module' defns... cleaner way?
        if (def.value.kind === 'Module') continue;

        const newValue = mapNode(def.value, rec => ({
            MemberExpression: ({module, member}): Reference => {
                let lhs: Expression | Module = module;
                while (true) {
                    if (lhs.kind === 'Reference') {
                        lhs = definitions[lhs.definitionId].value;
                    }
                    else if (lhs.kind === 'MemberExpression') {
                        lhs = rec(lhs);
                    }
                    else {
                        break;
                    }
                }
                assert(lhs.kind === 'Module');
                const {definitionId} = lookup(member.name, lhs.moduleId);
                return {kind: 'Reference', definitionId};
            },
        }));
        Object.assign(def, {value: newValue}); // TODO: messy overwrite of readonly prop - better/cleaner way?
    }



    // // The dereference function, closed over the given AST.
    // function deref(expr: Expression): Expression {
    //     const seen = [expr];
    //     while (true) {

    //         let tgt: Expression | undefined;
    //         if (expr.kind === 'Identifier') {
    //             if (expr.name.startsWith('@')) { // TODO: synthetic id for module - won't be in symbol table
    //                 const module = modulesById[expr.name];
    //                 assert(module);
    //                 console.log(`REF to module ${module.moduleId}`);
    //             }
    //             else {

    //             }


    //         }



    //         // If `expr` is a par|ref|mem expression, try to resolve to its target expression.
    //         if (expr.kind === 'ParenthesisedExpression') {
    //             tgt = expr.expression;
    //         }
    //         else if (expr.kind === 'GlobalReferenceExpression') {
    //             // Global references can always be resolved to their target node (which may be another deref'able node).
    //             tgt = resolveReference(expr);
    //         }
    //         else if (expr.kind === 'MemberExpression') {
    //             // Member expressions _may_ have an identifiable target node, but not always.
    //             tgt = resolveMember(expr);
    //         }

    //         // If the target expression for `expr` could not be determined, return `expr` unchanged.
    //         if (tgt === undefined) return expr;

    //         // If `expr` resolved to a target expression that isn't a par|ref|mem expression, return the target expression.
    //         if (tgt.kind !== 'GlobalReferenceExpression' && tgt.kind !== 'MemberExpression' && tgt.kind !== 'ParenthesisedExpression') return tgt;

    //         // If the target expression is still a par|ref|mem expression, keep iterating, but prevent an infinite loop.
    //         if (seen.includes(tgt)) {
    //             // TODO: improve diagnostic message, eg line/col ref
    //             const name = tgt.kind === 'GlobalReferenceExpression' ? tgt.globalName : tgt.kind === 'MemberExpression' ? tgt.member.name : '(?)'; // TODO: fix par case!
    //             throw new Error(`'${name}' is circularly defined`);
    //         }
    //         seen.push(tgt);
    //         expr = tgt;
    //     }
    // }







































    // TODO: for each module...
    for (let {moduleId, parentModuleId, bindings} of Object.values(modulesById)) {
        console.log(`MODULE ${moduleId}`);
        let parentScope = parentModuleId ? scopesByModuleId.get(parentModuleId) : rootScope;
        assert(parentScope); // TODO: sanity check - relies on specific order of modules in module map - fix this

        // Create a new scope for this module.
        let scope = Object.create(parentScope);
        scopesByModuleId.set(moduleId, scope);

        // TODO: for each binding...
        for (let {left, right} of bindings) {
            // TODO: ...
            [] = [left, right];


            // TODO: doc... what are we doing with `right` here?
            // - `right` is an Expression
            // - replace every Identifier with a Reference

            // right = mapNode(right, rec => ({

            //     // TODO: what is this for?
            //     MemberExpression: mem => {
            //         // collect 1 reference (in specific scope)
            //         // TODO: not actually collecting the reference yet...
            //         console.log(`    REF S?.${mem.member.name}`);


            //         // TODO: get the moduleId referred to by mem.module (must be statically resolvable)
            //         // - recursive search, based on `createDereferencer`


            //         let memᐟ = {...mem, module: rec(mem.module)};
            //         return memᐟ;
            //     },
    
            //     // Replace every Identifier with an equivalent Reference.
            //     Identifier: nam => {
            //         // collect 1 reference (in enclosing scope)
            //         console.log(`    REF ${nam.name}`);
    
            //         // Create placeholder Reference that will be backpatched later when defId is known
            //         let ref: Reference = {kind: 'Reference', definitionId: undefined!};
            //         refExprs.push({name: nam.name, moduleId, ref});
            //         return ref;
            //     },
            // }));
        }
        console.log(`END MODULE ${moduleId}`);
    }







    // TODO: temp testing... get this working
    if (1 + 1 !== 2) {
        traverseNode(null!, n => assert(definitionMapKinds.matches(n)));
    }

    // TODO: backpatch each Reference
    for (let {name, moduleId, ref} of references) {
        let scope = scopesByModuleId.get(moduleId);
        assert(scope); // TODO: ...
        let definition = scope[name];
        if (!definition) throw new Error(`'${name}' is not defined`); // TODO: improve diagnostic message
        Object.assign(ref, {definitionId: definition.definitionId});
    }

    if (1 !== 1 + 1) return null!;



    //let symbolTable: unknown;
    //let counter = 0;
    // let definitions = [] as Definition[];
    // mapMap(program.modulesByAbsPath, mod => {
    //     return mapNode2(mod, rec => ({

    //         // // Replace each LocalMultiBinding with a series of LocalBindings
    //         // Module: mod => {
    //         //     let bindings = [] as LocalBinding[];
    //         //     for (let binding of mod.bindings) {
    //         //         assert(sourceNodeKinds.includes(binding));
    //         //         if (binding.kind === 'LocalBinding') {
    //         //             bindings.push(rec(binding));
    //         //         }
    //         //         else {
    //         //             // Introduce a new local binding for the RHS.
    //         //             // TODO: ensure no collisions with program names. '$1' etc is ok since '$' isn't allowed in PEN ids.
    //         //             let localName = `$${++counter}`;
    //         //             let {names, value, exported} = binding;
    //         //             bindings.push({
    //         //                 kind: 'LocalBinding',
    //         //                 localName,
    //         //                 value: rec(value),
    //         //                 exported
    //         //             });

    //         //             // Introduce a local binding for each name in the LHS
    //         //             for (let {name: member, alias} of names) {
    //         //                 let ref: LocalReferenceExpression;
    //         //                 let mem: MemberExpression;
    //         //                 ref = {kind: 'LocalReferenceExpression', localName};
    //         //                 mem = {kind: 'MemberExpression', module: ref, member};
    //         //                 bindings.push({
    //         //                     kind: 'LocalBinding',
    //         //                     localName: alias ?? member,
    //         //                     value: mem,
    //         //                     exported
    //         //                 });
    //         //             }
    //         //         }
    //         //     }

    //         //     let modᐟ = {...mod, bindings};
    //         //     return modᐟ;
    //         // },
    //     }));
    // });

    return null!; /*{
        definitions,
        startSomething: '????',
    };*/





    // // TODO: temp testing...
    // function resolveExpressionToModuleId(expr: Expression) {

    // }
}
