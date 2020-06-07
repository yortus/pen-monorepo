import {ScopeSymbol} from '../../symbol-table';
import {Metadata as OldMetadata} from '../03-create-symbol-definitions';


export type Metadata = OldMetadata & {
    ImportExpression: {
        readonly scope: ScopeSymbol;
    };

    ReferenceExpression: {
        readonly symbolId: string;
    };
};
