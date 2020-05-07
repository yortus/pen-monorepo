import {Scope} from '../../scope';
import {SymbolTable} from '../../symbol-table';


export interface Metadata {
    Program: {
        readonly rootScope: Scope;
        readonly symbolTable: SymbolTable;
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
