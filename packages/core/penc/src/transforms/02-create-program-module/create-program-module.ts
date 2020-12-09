import {Identifier, mapNode, Module, traverseNode} from '../../abstract-syntax-trees';
import {ProgramModule, SourceFileMap, programModuleNodeKinds} from '../../representations';
import {assert, isDebugMode, mapObj, resolveModuleSpecifier} from '../../utils';
import {convertBindingListToModule} from './convert-binding-list-to-module';
import {createModuleNameGenerator} from './create-module-name-generator';


// TODO: jsdoc...
// - takes a collection of source files
// - converts all ImportExpressions to Identifiers, so there are no ImportExpression nodes in the output
// - converts all bindings to the Record (not array) form, so there are no Binding or ModulePattern nodes in the output
// - makes a single expression for the program synthesizing a root module and member expressions
export function createProgramModule({sourceFilesByPath, startPath}: SourceFileMap): ProgramModule {

    // TODO: temp testing...
    const generateModuleName = createModuleNameGenerator();
    const moduleIdsBySourceFilePath: Record<string, string> = {};
    for (let path of Object.keys(sourceFilesByPath)) {
        moduleIdsBySourceFilePath[path] = generateModuleName(path);
    }

    // TODO: temp testing...
    const sourceFileModules = Object.entries(sourceFilesByPath).reduce(
        (program, [sourceFilePath, {bindings}]) => {
            const moduleId = moduleIdsBySourceFilePath[sourceFilePath];
            const bindingsArray = bindings.map(binding => mapNode(binding, rec => ({
                BindingList: (bl): Module => {
                    let module = convertBindingListToModule(bl);
                    return {...module, bindings: mapObj(module.bindings, rec)};
                },
                ImportExpression: ({moduleSpecifier}): Identifier => {
                    const path = resolveModuleSpecifier(moduleSpecifier, sourceFilePath);
                    return {kind: 'Identifier', name: moduleIdsBySourceFilePath[path]};
                },
            })));
            program[moduleId] = convertBindingListToModule({kind: 'BindingList', bindings: bindingsArray});
            return program;
        },
        {} as Record<string, Module>
    );

    // TODO: temp testing...
    const programModule: ProgramModule = {
        bindings: {
            ...sourceFileModules,
            start: {
                kind: 'MemberExpression',
                module: {kind: 'Identifier', name: moduleIdsBySourceFilePath[startPath]},
                member: {kind: 'Identifier', name: 'start'},
            },
        },
    };

    // In debug mode, ensure only allowed node kinds are present in the representation.
    if (isDebugMode()) {
        for (let n of Object.values(programModule.bindings)) {
            traverseNode(n, n => assert(programModuleNodeKinds.matches(n)));
        }
    }

    return programModule;
}
