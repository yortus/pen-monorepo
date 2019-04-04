import {matchNode, Module, Node} from './ast';




// TODO: jsdoc...
export function annotateAst<Filter extends Node, NewProps extends {}>(ast: Module, an: Annotator<Filter, NewProps>) {
    return annotateNode(ast, an) as DeepAnnotate<Module, Filter, NewProps>;
}




// TODO: jsdoc...
export interface Annotator<Filter extends Node, NewProps extends {}> {
    filter: (node: Node) => node is Filter;
    newProps: (node: Filter) => NewProps;
}




// TODO: jsdoc...
export type DeepAnnotate<T, Filter extends Node, NewProps> =
    T extends string | number | boolean | null | undefined ? T :
    (DeepAnnotateProps<T, Filter, NewProps> & (T extends Filter ? NewProps : unknown));

// TODO: jsdoc...
export type DeepAnnotateProps<T, Filter extends Node, NewProps> = {
    [P in keyof T]:
        T[P] extends Array<infer E1> ? Array<DeepAnnotate<E1, Filter, NewProps>> :
        T[P] extends ReadonlyArray<infer E2> ? ReadonlyArray<DeepAnnotate<E2, Filter, NewProps>> :
        DeepAnnotate<T[P], Filter, NewProps>
};




// TODO: doc helper function
function annotateNode<F extends Node, P extends object>(node: Node, an: Annotator<F, P>) {
    const {filter, newProps} = an;
    let nodeWithAnnotatedChildren = annotateChildren(node, an);
    if (!filter(nodeWithAnnotatedChildren)) return nodeWithAnnotatedChildren;
    let annotatedNode = {...nodeWithAnnotatedChildren, ...(newProps(nodeWithAnnotatedChildren))};
    return annotatedNode;
}




// TODO: doc helper function
function annotateChildren<F extends Node, P extends object>(node: Node, an: Annotator<F, P>): Node {
    return matchNode<unknown>(node, {
        Application: n => ({
            ...n,
            combinator: annotateNode(n.combinator, an),
            arguments: n.arguments.map(arg => annotateNode(arg, an)),
        }),
        Block: n => ({...n, definitions: n.definitions.map(def => annotateNode(def, an))}),
        CharacterRange: n => n,
        Combinator: n => ({...n, expression: annotateNode(n.expression, an)}),
        Definition: n => ({...n, expression: annotateNode(n.expression, an)}),
        ForeignModule: n => n,
        ImportDeclaration: n => n,
        ListLiteral: n => ({...n, elements: n.elements.map(el => annotateNode(el, an))}),
        Parenthetical: n => ({...n, expression: annotateNode(n.expression, an)}),
        PenModule: n => ({...n, declarations: n.declarations.map(decl => annotateNode(decl, an))}),
        RecordField: n => ({
            ...n,
            name: n.hasComputedName ? annotateNode(n.name, an) : n.name,
            expression: annotateNode(n.expression, an),
        }),
        RecordLiteral: n => ({...n, fields: n.fields.map(field => annotateNode(field, an))}),
        Reference: n => n,
        Selection: n => ({...n, exprssions: n.expressions.map(expr => annotateNode(expr, an))}),
        Sequence: n => ({...n, exprssions: n.expressions.map(expr => annotateNode(expr, an))}),
        StringLiteral: n => n,
        VoidLiteral: n => n,
    }) as Node;
}
