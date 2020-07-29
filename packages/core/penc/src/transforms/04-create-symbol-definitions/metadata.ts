import {ScopeSymbol, SymbolTable} from '../../symbol-table';
import {Metadata as OldMetadata} from '../03-desugar-syntax';


export type Metadata = OldMetadata & {
    Program: {
        readonly symbolTable: SymbolTable;
    };

    Module: {
        readonly scope: ScopeSymbol;
    };

    SimpleBinding: {
        readonly symbolId: string;
    };
}
