import type {ExtractNode} from '../../abstract-syntax-trees';
import type {SourceFileInfo, SourceAst} from '../../representations';


export declare function parse(source: string, options: {sourceFile: SourceFileInfo}): ExtractNode<SourceAst, 'Module'>;
