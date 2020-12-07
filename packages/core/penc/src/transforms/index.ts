export {createSourceFileMap} from './01-create-source-file-map';
export {createModuleMap} from './02-create-module-map';
export {createDefinitionMap} from './03-create-definition-map';
export {simplifyDefinitionMap} from './04-simplify-definition-map';
export {resolveConstantValues} from './05-resolve-constant-values';
export {generateTargetCode} from './06-generate-target-code';




// TODO:
// - [x] revise ModuleMap type - see TODOs there
// - [ ] mapNode - always map 'Module' to 'Module'? Try it - does it break anything? Any exceptions to this rule?
// - [ ] two kinds of Module bindings - array and object - should be two Module kinds?
// - [ ] revise transform names in light of recent changes
// - [ ] revise representation names in light of recent changes
// - [ ] consider decoupling representation names from transform names
//   * eg a transform can input and output the same representation, but still do special work on it
//   * so the nodeKind assertions would then be specific to transforms, not representations
// - [ ] come up with proper way of safely/robustly generating synthetic identifiers that never clash with program-provided ones
//   * preferrably while permitting looser rules for program-provided identifiers (ie more like JS rules, not just a-z0-9_)
