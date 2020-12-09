import {allNodeKinds, Expression, Module} from '../abstract-syntax-trees';


/**
 * A PEN program expressed as a single AST, rooted at a top-level Module, which contains the following set of bindings:
 * - one binding for each source file in the program, whose value is a Module with that source file's bindings; and
 * - a 'start' binding representing the entry point of the program.
 */
export type ProgramModule = Omit<Module, 'kind'> & {readonly bindings: {start: Expression}};


/** List of node kinds that may be present in a Module representation. */
export const programModuleNodeKinds = allNodeKinds.without(
    'Binding',
    'BindingList',
    'Definition',
    'ImportExpression',
    'ModulePattern',
    'Reference',
);
