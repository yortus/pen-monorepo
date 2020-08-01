import {Metadata as OldMetadata} from '../03-desugar-syntax';


export type Metadata = OldMetadata & {
    Program: {
        readonly startSymbolId: string;
    };

    SimpleBinding: {
        readonly symbolId: string;
    };

    ReferenceExpression: {
        readonly symbolId: string;
    };
};
