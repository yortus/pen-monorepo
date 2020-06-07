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

    VariablePattern: {
        readonly symbolId: string;
    };

    ModulePatternName: {
        readonly symbolId: string;
    };
}
