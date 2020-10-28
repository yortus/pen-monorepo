import {Definition, Expression, mapNode, ReferenceExpression, traverseNode} from '../../abstract-syntax-trees';
import {DefinitionMap, definitionMapKinds, ModuleMap, moduleMapKinds} from '../../representations';
import {assert, mapMap} from '../../utils';


// TODO: doc... after this transform, the following node kinds will no longer be present anywhere in the AST:
// - LocalMultiBinding
export function createDefinitionMap(moduleMap: ModuleMap): DefinitionMap {

    let currentScope = Object.create(null) as Record<string, Definition | undefined>;
    let refExprs = [] as {name: string, scope: Record<string, Definition | undefined>, ref: ReferenceExpression}[];
    let definitions = [] as Definition[];

    function define(name: string, expression: Expression) {
        console.log(`    DEF ${name}`);
        if (Object.keys(currentScope).includes(name)) {
            throw new Error(`'${name}' is already defined`); // TODO: improve diagnostic message
        }
        let definition: Definition = {
            kind: 'Definition',
            id: definitions.length,
            localName: name,
            globalName: '???', // TODO
            expression,
        };
        definitions.push(definition);
        currentScope[name] = definition;
    }

    mapMap(moduleMap.modulesById, module => {

        // TODO: temp testing...
        traverseNode(module, n => assert(moduleMapKinds.matches(n)));

        // TODO: temp testing...
        mapNode(module, rec => ({

            Module: mod => {
                console.log(`MODULE ${mod.id}`);
                currentScope = Object.create(currentScope);
                mod.bindings.forEach(rec);
                currentScope = Object.getPrototypeOf(currentScope);
                console.log(`END MODULE ${mod.id}`);
                return mod;
            },

            Binding: bnd => {
                if (bnd.pattern.kind === 'NamePattern') {
                    // - if NamePattern: collect 1 definition
                    define(bnd.pattern.name, bnd.value);
                }
                else /* pattern.kind === 'ModulePattern' */ {
                    // - if ModulePattern: collect 1 definition (alias) and 1 reference (in specific scope)
                    for (let {name, alias} of bnd.pattern.names) {
                        alias ??= name;

                        // TODO: fix this...
                        let expr: Expression = null!;

                        define(alias, expr);
                        console.log(`    REF S?.${name}`);
                    }
                }
                rec(bnd.value);
                return bnd
            },

            MemberExpression: mem => {
                // collect 1 reference (in specific scope)
                console.log(`    REF S?.${mem.bindingName}`);
                rec(mem.module);
                return mem;
            },

            NameExpression: nam => {
                // collect 1 reference (in enclosing scope)
                console.log(`    REF ${nam.name}`);

                // Create placeholder ReferenceExpression that will be backpatched later when defId is known
                let ref: ReferenceExpression = {kind: 'ReferenceExpression', definitionId: -1};

                refExprs.push({name: nam.name, scope: currentScope, ref});
                return ref;
            },
        }));
    });

    // TODO: temp testing... get this working
    if (1 + 1 !== 2) {
        traverseNode(null!, n => assert(definitionMapKinds.matches(n)));
    }

    // TODO: backpatch each ReferenceExpression
    for (let {name, scope, ref} of refExprs) {
        let definition = scope[name];
        if (!definition) throw new Error(`'${name}' is not defined`); // TODO: improve diagnostic message
        Object.assign(ref, {definitionId: definition.id});
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
