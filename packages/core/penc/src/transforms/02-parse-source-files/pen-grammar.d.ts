import type {Module} from '../../ast-nodes';
import type {SourceFileInfo} from '../01-create-source-file-graph';


export declare function parse(moduleSource: string, options: {sourceFile: SourceFileInfo}): Module;
