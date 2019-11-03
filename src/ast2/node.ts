// TODO: interpret as purely additive. So:
// - The set of Node kinds is locked by the base/initial version
// - Node kinds can never be added or deleted in future versions
// - Node kinds can have properties added but not altered or removed (maybe altering could work? revise?)
// - Ast transforms can only add properties - they cannot change node kinds (call it 'annotateAst'?)


import {ExpressionNodeKind, NodeKind} from './node-kind';
import {NodeVersion} from './node-version';
import {Scope, SymbolInfo} from './scope';


export type Node<V extends NodeVersion = NodeVersion, K extends NodeKind = NodeKind> =
    V extends 100 ? AstSchemaBase<100>[K] :
    V extends 200 ? (AstSchemaBase<200> & AstSchema200)[K] :
    V extends 300 ? (AstSchemaBase<300> & AstSchema200 & AstSchema300)[K] :
    never;


export type Expression<V extends NodeVersion> = Node<V> extends infer U
    ? (U extends {kind: ExpressionNodeKind} ? U : never)
    : never;


type WithKind<T extends AstSchema<T>> = {[K in keyof T]: {[P in 'kind' | keyof T[K]] : ({kind: K} & T[K])[P]};


type AstSchema<T> =
    & Record<NodeKind, unknown>
    & {[K in keyof T]: K extends NodeKind ? object : 'keys must be valid NodeKinds'};


type AstSchemaBase<V extends NodeVersion> = WithKind<{

    // Top-level...
    ModuleDefinition: {
        imports: Array<Node<V, 'ImportNames'> | Node<V, 'ImportNamespace'>>;
        block: Node<V, 'Block'>;
    };

    Definition: {
        name: string;
        expression: Expression<V>;
        isExported: boolean;
    };

    // Expressions...
    Application: {
        function: Expression<V>; // rename: function?
        arguments: Array<Expression<V>>;
    };

    Block: {
        definitions: Array<Node<V, 'Definition'>>;
    };

    CharacterRange: { // rename: CharRange
        subkind: 'Abstract' | 'Concrete';
        minValue: string;
        maxValue: string;
    };

    Function: {
        parameters: string[];
        expression: Expression<V>;
    };

    ListLiteral: { // rename: List
        elements: Array<Expression<V>>;
    };

    Parenthetical: {
        expression: Expression<V>;
    };

    RecordLiteral: { // rename: Record
        fields: Array<Node<V, 'RecordField'>>;
    };

    // TODO: rename RuleReference -or- BindingReference -or- NameReference
    Reference: {
        namespaces?: [string, ...string[]];
        name: string;
    };

    Selection: {
        expressions: Array<Expression<V>>;
    };

    Sequence: {
        expressions: Array<Expression<V>>;
    };

    StringLiteral: { // rename: String
        subkind: 'Abstract' | 'Concrete';
        value: string;
    };

    VoidLiteral: { // rename: Void
    };

    // Other kinds...
    ImportNames: {
        moduleSpecifier: string;
        names: string[];
    };

    ImportNamespace: {
        moduleSpecifier: string;
        namespace: string;
    };

    RecordField: { // rename: Field
        hasComputedName: false;
        name: string;
        expression: Expression<V>;
    } | {
        hasComputedName: true;
        name: Expression<V>;
        expression: Expression<V>;
    };
}>;


interface AstSchema200 {
    Definition: {
        symbol: SymbolInfo;
    };

    Block: {
        scope: Scope;
    };

    ImportNames: {
        symbols: SymbolInfo[];
    };

    ImportNamespace: {
        symbol: SymbolInfo;
    };
}


interface AstSchema300 {
    Reference: {
        symbol: SymbolInfo;
    };
}
