import {Scope} from '../../scope';
import {SymbolTable} from '../../symbol-table';


export interface SymbolDefinitions {
    Program: {
        readonly rootScope: Scope;
        readonly symbolTable: SymbolTable;
    };

    Module: {
        readonly scope: Scope;
    };

    VariablePattern: {
        readonly symbolId: number;
    };

    ModulePatternName: {
        readonly symbolId: number;
    };
}
