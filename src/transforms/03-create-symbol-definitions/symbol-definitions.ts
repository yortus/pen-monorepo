import {Scope} from '../../scopes';
import {Symbol} from '../../symbols';


export interface SymbolDefinitions {
    Program: {
        readonly scope: Scope;
    };

    Module: {
        readonly scope: Scope;
    };

    // FunctionExpression: {
    //     readonly scope: Scope;
    // };

    VariablePattern: {
        readonly symbol: Symbol;
    };

    ModulePatternName: {
        readonly symbol: Symbol;
    };
}
