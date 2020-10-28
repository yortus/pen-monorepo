import {Definition, Expression, mapNode, ReferenceExpression, traverseNode} from '../../abstract-syntax-trees';
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
            globalName: '???', // TODO
            expression,
        };
        definitions.push(definition);
        scope[name] = definition;
    }




    // TODO: for each module...
    for (let {moduleId, parentModuleId, bindings} of moduleMap.modulesById.values()) {
        console.log(`MODULE ${moduleId}`);
        let parentScope = parentModuleId ? scopesByModuleId.get(parentModuleId) : globalScope;
        assert(parentScope); // TODO: sanity check - relies on specific order of modules in module map - fix this
        let scope = Object.create(parentScope);
        scopesByModuleId.set(moduleId, scope);

        // TODO: for each binding...
        for (let {pattern, value} of bindings) {

            value = mapNode(value, rec => ({
                MemberExpression: mem => {
                    // collect 1 reference (in specific scope)
                    console.log(`    REF S?.${mem.bindingName}`);
                    return {...mem, module: rec(mem.module)};
                },
    
                NameExpression: nam => {
                    // collect 1 reference (in enclosing scope)
                    console.log(`    REF ${nam.name}`);
    
                    // Create placeholder ReferenceExpression that will be backpatched later when defId is known
                    let ref: ReferenceExpression = {kind: 'ReferenceExpression', definitionId: -1};
    
                    refExprs.push({name: nam.name, moduleId, ref});
                    return ref;
                },
            }));

            if (pattern.kind === 'NamePattern') {
                // - if NamePattern: collect 1 definition
                define(pattern.name, moduleId, value);
            }
            else /* pattern.kind === 'ModulePattern' */ {
                // - if ModulePattern: collect 1 definition (alias) and 1 reference (in specific scope)
                for (let {name, alias} of pattern.names) {
                    alias ??= name;

                    // TODO: fix this...
                    let expr: Expression = null!;

                    define(alias, moduleId, expr);
                    console.log(`    REF S?.${name}`);
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

    //         Binding: 'default',

    //         // TODO: this one will be discarded after this transform
    //         Module: (({bindings}: Module): Definition => {
    //             for (let {pattern, value} of bindings) {
    //                 console.log(`PATTERN ${pattern.kind} --- VALUE ${value.kind}`);
    //                 pattern.kind;
    //                 value.kind;
    //                 rec(value);
    //             }

    //             assert(true); // TODO: remove

    //             return {
    //                 kind: 'Definition',
    //                 id: -1,
    //                 expression: {kind: 'NullLiteralExpression', value: null},
    //                 localName: '???',
    //                 globalName: '???',
    //             };
    //         }) as any,

    //         // TODO: this needs to be turned into a ReferenceExpression - collect it now and backpatch it later
    //         NameExpression: ({name}): ReferenceExpression => {
    //             console.log(`NAMEXPR "${name}"`);
    //             return {kind: 'ReferenceExpression', definitionId: -1};
    //         },

    //         // TODO: these two are good - they are handled as part of `Module` handling
    //         ModulePattern: 'default',
    //         NamePattern: 'default',


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
    //         //             for (let {name: bindingName, alias} of names) {
    //         //                 let ref: LocalReferenceExpression;
    //         //                 let mem: MemberExpression;
    //         //                 ref = {kind: 'LocalReferenceExpression', localName};
    //         //                 mem = {kind: 'MemberExpression', module: ref, bindingName};
    //         //                 bindings.push({
    //         //                     kind: 'LocalBinding',
    //         //                     localName: alias ?? bindingName,
    //         //                     value: mem,
    //         //                     exported
    //         //                 });
    //         //             }
    //         //         }
    //         //     }

    //         //     let modᐟ = {...mod, bindings};
    //         //     return modᐟ;
    //         // },

    //         // // This is handled within the 'Module' callback, but must be present since it's in Source but not Desugared
    //         // LocalMultiBinding: 'default',
    //     }));
    // });

    return null!; /*{
        definitions,
        startSomething: '????',
    };*/
}
