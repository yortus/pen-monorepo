// import {AbsPath} from '../../utils';


// // TODO: doc...
// export type Symbol = ScopeSymbol | NameSymbol;


// /** Corresponds to a scope (ie a module or extension) in the source code. */
// export interface ScopeSymbol {
//     kind: 'ScopeSymbol';
//     scopeName: string;
//     localNames: Map<string, NameSymbol>;
// }


// /** Corresponds to a identifier name in the source code. */
// export interface NameSymbol {
//     kind: 'NameSymbol';
//     globalName: string;
//     scope: ScopeSymbol;
//     localName: string;
// }


// // TODO: doc...
// export class SymbolTable {

//     constructor() {
//         this.allSymbolsByGlobalName = new Map();
//         this.parentScopes = new Map();
//     }

//     // TODO: doc... also creates a symbol for the scope in the parent scope.
//     createScope(parent: ScopeSymbol | undefined, modulePath?: AbsPath): ScopeSymbol {
//         // TODO: must ensure this synthetic scope name never clashes with any program-defined identifiers.
//         let scopeName = this.generateUniqueScopeName(modulePath);
//         let scopeSymbol: ScopeSymbol = {kind: 'ScopeSymbol', scopeName, localNames: new Map()};
//         this.allSymbolsByGlobalName.set(scopeName, scopeSymbol);
//         this.parentScopes.set(scopeSymbol, parent ?? 'none');
//         return scopeSymbol;
//     }

//     createName(localName: string, scope: ScopeSymbol): NameSymbol {
//         // ensure not already defined in this scope
//         if (scope.localNames.has(localName)) throw new Error(`Symbol '${localName}' is already defined.`);
//         let globalName = `${scope.scopeName}_${localName}`;
//         let symbol: Symbol = {kind: 'NameSymbol', globalName, localName, scope};
//         scope.localNames.set(localName, symbol);
//         this.allSymbolsByGlobalName.set(globalName, symbol);
//         return symbol;
//     }

//     lookupName(localName: string, scope: ScopeSymbol): NameSymbol {
//         if (scope.localNames.has(localName)) return scope.localNames.get(localName)!;
//         let parentScope = this.parentScopes.get(scope)!;
//         if (parentScope !== 'none') return this.lookupName(localName, parentScope);
//         throw new Error(`Symbol '${localName}' is not defined.`);
//     }

//     private allSymbolsByGlobalName: Map<string, Symbol>;

//     private parentScopes: Map<ScopeSymbol, ScopeSymbol | 'none'>;

//     private generateUniqueScopeName(modulePath = '') {
//         let name = modulePath
//             .split(/\/+|\\+/) // split on segment delimiters / and \
//             .map(s => s.substring(0, s.indexOf('.')) || s) // remove extensions
//             .reverse() // reverse the order of the segments
//             .concat(`𝕊${this.parentScopes.size}`) // add a fallback name to guarantee the result is not undefined
//             .filter(seg => seg && seg !== 'index') // remove empty and 'index' segments
//             .shift()! // take the first segment
//             .replace(/^[0-9]+/g, '') // remove leading digits, if any
//             .replace(/[^a-zA-Z0-9𝕊]/g, '_'); // replace all non-alphanumeric chars with '_'

//         // Ensure no duplicate scope names
//         let existingScopeNames = [...this.parentScopes.keys()].map(s => s.scopeName);
//         let newScopeName = name;
//         let counter = 0;
//         while (existingScopeNames.includes(newScopeName)) newScopeName = `${name}${++counter}`;
//         return newScopeName;
//     }
// }
