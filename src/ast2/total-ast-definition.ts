// TODO: interpret as purely additive. So:
// - The set of Node kinds is locked by the base/initial version
// - Node kinds can never be added or deleted in future versions
// - Node kinds can have properties added but not altered or removed (maybe altering could work? revise?)
// - Ast transforms can only add properties - they cannot change node kinds (call it 'annotateAst'?)


import {Scope, SymbolInfo} from './scope';
import {AstVersion, Expression, NodeFromKind} from './type-operators';


export interface TotalAstDefinition<V extends AstVersion = any> {
    100: {
        // Top-level...
        ModuleDefinition: {
            kind: 'ModuleDefinition';
            imports: Array<NodeFromKind<V, 'ImportNames'> | NodeFromKind<V, 'ImportNamespace'>>;
            block: NodeFromKind<V, 'Block'>;
        },
        Definition: {
            kind: 'Definition';
            name: string;
            expression: Expression<V>;
            isExported: boolean;
        },

        // Expressions...
        Application: {
            kind: 'Application';
            isExpression: true,
            function: Expression<V>; // rename: function?
            arguments: Array<Expression<V>>;
        },

        Block: {
            kind: 'Block';
            isExpression: true,
            definitions: Array<NodeFromKind<V, 'Definition'>>;
        },

        CharacterRange: { // rename: CharRange
            kind: 'CharacterRange';
            isExpression: true,
            subkind: 'Abstract' | 'Concrete';
            minValue: string;
            maxValue: string;
        },

        Function: {
            kind: 'Function';
            isExpression: true,
            parameters: string[];
            expression: Expression<V>;
        },

        ListLiteral: { // rename: List
            kind: 'ListLiteral';
            isExpression: true,
            elements: Array<Expression<V>>;
        },

        Parenthetical: {
            kind: 'Parenthetical';
            isExpression: true,
            expression: Expression<V>;
        },

        RecordLiteral: { // rename: Record
            kind: 'RecordLiteral';
            isExpression: true,
            fields: Array<NodeFromKind<V, 'RecordField'>>;
        },

        // TODO: rename RuleReference -or- BindingReference -or- NameReference
        Reference: {
            kind: 'Reference';
            isExpression: true,
            namespaces?: [string, ...string[]];
            name: string;
        },

        Selection: {
            kind: 'Selection';
            isExpression: true,
            expressions: Array<Expression<V>>;
        },

        Sequence: {
            kind: 'Sequence';
            isExpression: true,
            expressions: Array<Expression<V>>;
        },

        StringLiteral: { // rename: String
            kind: 'StringLiteral';
            isExpression: true,
            subkind: 'Abstract' | 'Concrete';
            value: string;
        },

        VoidLiteral: { // rename: Void
            kind: 'VoidLiteral';
            isExpression: true,
        },

        // Other kinds...
        ImportNames: {
            kind: 'ImportNames';
            moduleSpecifier: string;
            names: string[];
            // 2: symbols: SymbolInfo[];
        },

        ImportNamespace: {
            kind: 'ImportNamespace';
            moduleSpecifier: string;
            namespace: string;
            // 2: symbol: SymbolInfo;
        },

        RecordField: { // rename: Field
            kind: 'RecordField';
            hasComputedName: false;
            name: string;
            expression: Expression<V>;
        } | {
            kind: 'RecordField';
            hasComputedName: true;
            name: Expression<V>;
            expression: Expression<V>;
        },
    };

    200: {
        Definition: {
            symbol: SymbolInfo;
        },

        Block: {
            scope: Scope;
        },
    };

    300: {
        Reference: {
            symbol: SymbolInfo;
        },
    };
}
