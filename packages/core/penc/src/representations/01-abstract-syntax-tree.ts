import {allNodeKinds, Expression, Module} from '../ast-nodes';


/**
 * A PEN program expressed as an AST, rooted at a top-level Module, which contains the following set of bindings:
 * - one binding for each source file in the program, whose value is a Module with that source file's bindings; and
 * - a 'start' binding representing the entry point of the program.
 */
export type AbstractSyntaxTree = Omit<Module, 'kind'> & {readonly bindings: {start: Expression}};


/** List of node kinds that may be present in an AbstractSyntaxTree representation. */
export const abstractSyntaxTreeNodeKinds = allNodeKinds.without(
    'Binding',
    'BindingList',
    'Definition',
    'ImportExpression',
    'ModulePattern',
    'ParenthesisedExpression',
    'Reference',
);
