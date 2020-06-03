import {Scope, SymbolTable} from '../../symbol-table';


export interface Metadata {
    Program: {
        readonly symbolTable: SymbolTable;
        readonly startSymbolId: number;
    };

    Module: {
        readonly scope: Scope;
    };

    ExtensionFile: {
        readonly scope: Scope;
    };

    VariablePattern: {
        readonly symbolId: number;
    };

    ModulePatternName: {
        readonly symbolId: number;
    };
}
