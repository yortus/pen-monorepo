import * as fs from 'fs';
import {Program, SourceFile} from '../../ast-nodes';
import {mapMap} from '../../utils';
import {SourceFileGraph} from '../01-create-source-file-graph';
import {parse} from './pen-grammar';


export function parseSourceFiles(sourceFileGraph: SourceFileGraph): Program {
    let sourceFiles = mapMap(sourceFileGraph.sourceFiles, (sourceFile): SourceFile => {
        let sourceText = fs.readFileSync(sourceFile.path, 'utf8');
        let module = parse(sourceText, {sourceFile});
        return {
            kind: 'SourceFile',
            path: sourceFile.path,
            imports: sourceFile.imports,
            module,
            meta: {},
        };
    });
    return {
        kind: 'Program',
        sourceFiles,
        mainPath: sourceFileGraph.mainPath,
        meta: {},
    };
}
