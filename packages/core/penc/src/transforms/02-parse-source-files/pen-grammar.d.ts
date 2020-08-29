import type {NodeFromAstType, SourceFileInfo, SourceProgram} from '../../representations';


export declare function parse(source: string, options: {sourceFile: SourceFileInfo}): NodeFromAstType<SourceProgram, 'Module'>;
