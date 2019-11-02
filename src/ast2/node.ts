// TODO: interpret as purely additive. So:
// - The set of Node kinds is locked by the base/initial version
// - Node kinds can never be added or deleted in future versions
// - Node kinds can have properties added but not altered or removed (maybe altering could work? revise?)
// - Ast transforms can only add properties - they cannot change node kinds (call it 'annotateAst'?)


import {NodeKind} from './node-kind';
import {NodeVersion} from './node-version';
import {Scope, SymbolInfo} from './scope';


export type Node<V extends NodeVersion = NodeVersion, K extends NodeKind = NodeKind> =
    V extends 100 ? AstSchemaBase<100>[K] :
    V extends 200 ? (AstSchemaBase<200> & AstSchema200)[K] :
    V extends 300 ? (AstSchemaBase<300> & AstSchema200 & AstSchema300)[K] :
    never;


export type Expression<V extends NodeVersion> = Node<V> extends infer U
    ? (U extends {meta: {isExpression: true}} ? U : never)
    : never;


type WithKind<T extends AstSchema<T>> = {[K in keyof T]: {kind: K} & T[K]};


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
        meta: {isExpression: true};
        function: Expression<V>; // rename: function?
        arguments: Array<Expression<V>>;
    };

    Block: {
        meta: {isExpression: true};
        definitions: Array<Node<V, 'Definition'>>;
    };

    CharacterRange: { // rename: CharRange
        meta: {isExpression: true};
        subkind: 'Abstract' | 'Concrete';
        minValue: string;
        maxValue: string;
    };

    Function: {
        meta: {isExpression: true};
        parameters: string[];
        expression: Expression<V>;
    };

    ListLiteral: { // rename: List
        meta: {isExpression: true};
        elements: Array<Expression<V>>;
    };

    Parenthetical: {
        meta: {isExpression: true};
        expression: Expression<V>;
    };

    RecordLiteral: { // rename: Record
        meta: {isExpression: true};
        fields: Array<Node<V, 'RecordField'>>;
    };

    // TODO: rename RuleReference -or- BindingReference -or- NameReference
    Reference: {
        meta: {isExpression: true};
        namespaces?: [string, ...string[]];
        name: string;
    };

    Selection: {
        meta: {isExpression: true};
        expressions: Array<Expression<V>>;
    };

    Sequence: {
        meta: {isExpression: true};
        expressions: Array<Expression<V>>;
    };

    StringLiteral: { // rename: String
        meta: {isExpression: true};
        subkind: 'Abstract' | 'Concrete';
        value: string;
    };

    VoidLiteral: { // rename: Void
        meta: {isExpression: true};
    };

    // Other kinds...
    ImportNames: {
        moduleSpecifier: string;
        names: string[];
        // 2: symbols: SymbolInfo[];
    };

    ImportNamespace: {
        moduleSpecifier: string;
        namespace: string;
        // 2: symbol: SymbolInfo;
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
}


interface AstSchema300 {
    Reference: {
        symbol: SymbolInfo;
    };
}
