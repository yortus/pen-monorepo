import type {Module} from '../../abstract-syntax-trees';
import type {SourceFileInfo} from '../../representations';


export declare function parse(source: string, options: {sourceFile: SourceFileInfo}): Module;
