import {Metadata as OldMetadata} from '../04-create-symbol-definitions';


export type Metadata = OldMetadata & {
    ReferenceExpression: {
        readonly symbolId: string;
    };
};
