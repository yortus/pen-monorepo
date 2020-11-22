import type {Definition, Expression, Module} from '../../abstract-syntax-trees';
import {assert} from '../../utils';


// TODO: jsdoc...
export function createSymbolTable() {
    type Scope = Record<string, Definition | undefined>;
    let scopesByModuleId = new Map<string, Scope>();
    let definitions = [] as Definition[];

    return {
        // TODO: jsdoc...
        definitions,

        // TODO: jsdoc...
        createScope(moduleId: string, parentModuleId?: string) {
            const parentScope = parentModuleId ? scopesByModuleId.get(parentModuleId)! : null;
            assert(parentModuleId === undefined || parentScope);
            const scope = Object.create(parentScope);
            scopesByModuleId.set(moduleId, scope);
        },

        // TODO: jsdoc...
        // Helper function to add a definition for `name` into the given module's scope.
        define(name: string, moduleId: string, value: Expression | Module): Definition {
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
        },

        // TODO: jsdoc...
        lookup(name: string, moduleId: string): Definition {
            const scope = scopesByModuleId.get(moduleId);
            assert(scope); // sanity check
            let definition = scope[name];
            if (!definition) {
                throw new Error(`'${name}' is not defined`); // TODO: improve diagnostic message eg line+col
            }
            return definition;
        },
    };
}
