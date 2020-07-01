import {ScopeSymbol, SymbolTable} from '../../symbol-table';


export interface Metadata {
    Program: {
        readonly symbolTable: SymbolTable;
        readonly startSymbolId: string;
    };

    Module: {
        readonly scope: ScopeSymbol;
    };

    ExtensionFile: {
        readonly scope: ScopeSymbol;
    };

    SimpleBinding: {
        readonly symbolId: string;
    };

    DestructuredBinding: {
        readonly symbolIds: string[];
    };
}
