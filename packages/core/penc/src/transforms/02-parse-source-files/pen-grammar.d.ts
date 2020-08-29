import type {NodeFromAstType} from '../../abstract-syntax-trees';
import type {SourceFileInfo, SourceProgram} from '../../representations';


export declare function parse(source: string, options: {sourceFile: SourceFileInfo}): NodeFromAstType<SourceProgram, 'Module'>;
