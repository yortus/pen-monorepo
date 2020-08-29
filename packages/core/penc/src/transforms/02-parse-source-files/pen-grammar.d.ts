import type {ExtractNode} from '../../abstract-syntax-trees';
import type {SourceFileInfo, SourceProgram} from '../../representations';


export declare function parse(source: string, options: {sourceFile: SourceFileInfo}): ExtractNode<SourceProgram, 'Module'>;
