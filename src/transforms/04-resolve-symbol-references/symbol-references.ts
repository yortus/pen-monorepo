import {Scope} from '../../scope';


export interface SymbolReferences {
    ImportExpression: {
        readonly scope: Scope;
    };

    ReferenceExpression: {
        readonly symbolId: number;
    };
}
