export {createSourceFileMap} from './01-create-source-file-map';
export {createProgramModule} from './02-create-program-module';
export {createDefinitionMap} from './03-create-definition-map';
export {simplifyDefinitionMap} from './04-simplify-definition-map';
export {resolveConstantValues} from './05-resolve-constant-values';
export {generateTargetCode} from './06-generate-target-code';


// TODO:
// - [ ] revise transform names in light of recent changes
// - [ ] revise representation names in light of recent changes


/*

REPRESENTATIONS
SourceFileMap   (source file binding lists by path + start path)
ModuleMap       (a synthesized module containing all source file modules, plus a name for the start rule in the synth module)
DefinitionMap   (all definitions keyed by id + start definition id)



TRANSFORMS
createSourceFileMap:    () => SourceFileMap
createModuleMap:        SourceFileMap => ModuleMap
createDefinitionMap:    ModuleMap => DefinitionMap
simplifyDefinitionMap:  DefinitionMap => DefinitionMap



SourceFilesAsts
ProgramModule
GlobalDefinitions






*/
