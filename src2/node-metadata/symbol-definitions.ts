import {Scope} from './scope';
import {Symbol} from './symbol';


export interface SymbolDefinitions {
    Program: {
        readonly scope: Scope;
    };

    Module: {
        readonly scope: Scope;
    };

    FunctionExpression: {
        readonly scope: Scope;
    };

    VariablePattern: {
        readonly symbol: Symbol;
    };

    ModulePatternName: {
        readonly symbol: Symbol;
    };
}
