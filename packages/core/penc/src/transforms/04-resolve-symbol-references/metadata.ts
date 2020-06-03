import {Scope} from '../../symbol-table';
import {Metadata as OldMetadata} from '../03-create-symbol-definitions';


export type Metadata = OldMetadata & {
    ImportExpression: {
        readonly scope: Scope;
    };

    ReferenceExpression: {
        readonly symbolId: string;
    };
};
