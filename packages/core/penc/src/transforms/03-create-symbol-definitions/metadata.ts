import {Scope, SymbolTable} from '../../symbol-table';


export interface Metadata {
    Program: {
        readonly symbolTable: SymbolTable;
        readonly startSymbolId: string;
    };

    Module: {
        readonly scope: Scope;
    };

    ExtensionFile: {
        readonly scope: Scope;
    };

    VariablePattern: {
        readonly symbolId: string;
    };

    ModulePatternName: {
        readonly symbolId: string;
    };
}
