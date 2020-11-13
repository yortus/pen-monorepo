import type {SourceFile} from '../../abstract-syntax-trees';
import type {AbsPath} from '../../utils';


export declare function parse(source: string, options: {path: AbsPath}): SourceFile;
