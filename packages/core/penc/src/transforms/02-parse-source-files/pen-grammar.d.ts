import type {Module} from '../../ast-nodes';
import type {SourceFileInfo} from '../asts';


export declare function parse(source: string, options: {sourceFile: SourceFileInfo}): Module;
