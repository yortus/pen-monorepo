import type {NodeFromProgram, SourceFileInfo, SourceProgram} from '../../representations';


export declare function parse(source: string, options: {sourceFile: SourceFileInfo}): NodeFromProgram<SourceProgram, 'Module'>;
