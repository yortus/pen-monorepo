import type {NodeFromAst, SourceFileInfo, SourceProgram} from '../../representations';


export declare function parse(source: string, options: {sourceFile: SourceFileInfo}): NodeFromAst<SourceProgram, 'Module'>;
