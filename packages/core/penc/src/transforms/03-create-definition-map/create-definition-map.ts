import {Definition, Expression, /*mapNode,*/ MemberExpression, ReferenceExpression, traverseNode} from '../../abstract-syntax-trees';
import {DefinitionMap, definitionMapKinds, ModuleMap} from '../../representations';
import {assert} from '../../utils';


// TODO: doc... after this transform, the following node kinds will no longer be present anywhere in the AST:
// - LocalMultiBinding
export function createDefinitionMap(moduleMap: ModuleMap): DefinitionMap {
    type Scope = Record<string, Definition | undefined>;
    let scopesByModuleId = new Map<string, Scope>();
    let globalScope = Object.create(null) as Scope;
    let refExprs = [] as {name: string, moduleId: string, ref: ReferenceExpression}[];
    let definitions = [] as Definition[];


    function define(name: string, moduleId: string, expression: Expression) {
        console.log(`    DEF ${name}`);
        let scope = scopesByModuleId.get(moduleId);
        assert(scope); // TODO: ...
        if (Object.keys(scope).includes(name)) {
            throw new Error(`'${name}' is already defined`); // TODO: improve diagnostic message
        }
        let definition: Definition = {
            kind: 'Definition',
            definitionId: definitions.length,
            localName: name,
            globalName: undefined!, // TODO
            expression,
        };
        definitions.push(definition);
        scope[name] = definition;
    }




    // TODO: for each module...
    for (let {moduleId, parentModuleId, bindings} of Object.values(moduleMap.modulesById)) {
        console.log(`MODULE ${moduleId}`);
        let parentScope = parentModuleId ? scopesByModuleId.get(parentModuleId) : globalScope;
        assert(parentScope); // TODO: sanity check - relies on specific order of modules in module map - fix this

        // Create a new scope for this module.
        let scope = Object.create(parentScope);
        scopesByModuleId.set(moduleId, scope);

        // TODO: for each binding...
        for (let {left, right} of bindings) {

            // TODO: doc... what are we doing with `right` here?
            // - `right` is an Expression
            // - replace every Identifier with a ReferenceExpression

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
    
            //     // Replace every Identifier with an equivalent ReferenceExpression.
            //     Identifier: nam => {
            //         // collect 1 reference (in enclosing scope)
            //         console.log(`    REF ${nam.name}`);
    
            //         // Create placeholder ReferenceExpression that will be backpatched later when defId is known
            //         let ref: ReferenceExpression = {kind: 'ReferenceExpression', definitionId: undefined!};
            //         refExprs.push({name: nam.name, moduleId, ref});
            //         return ref;
            //     },
            // }));

            // For a simple `name = value` binding, create a single binding from name to value in the current scope.
            if (left.kind === 'Identifier') {
                define(left.name, moduleId, right);
            }

            // For a destructured `{a, b} = module` binding, for each name in `left`,
            // create a binding from the name to a synthesized MemberExpression referencing `module.member`
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
        console.log(`END MODULE ${moduleId}`);
    }



    // TODO: temp testing... get this working
    if (1 + 1 !== 2) {
        traverseNode(null!, n => assert(definitionMapKinds.matches(n)));
    }

    // TODO: backpatch each ReferenceExpression
    for (let {name, moduleId, ref} of refExprs) {
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
