import type {Module} from '../../ast-nodes';
import type {SourceFileInfo} from '../01-create-source-file-graph';


export declare function parse(source: string, options: {sourceFile: SourceFileInfo, nextId: () => number}): Module;
