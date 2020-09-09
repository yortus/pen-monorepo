import type {NodeKind} from '../node-kind';
import type {AbstractSyntaxTree} from './abstract-syntax-tree';
import * as Binding from './binding';
import * as Expression from './expression';
import type {Module} from './module';


export type Node<KS extends NodeKind = NodeKind> = {

    // Top-level nodes
    AbstractSyntaxTree: AbstractSyntaxTree<KS>,
    Module: Module<KS>,

    // Binding nodes
    GlobalBinding: Binding.GlobalBinding<KS>,
    LocalBinding: Binding.LocalBinding<KS>,
    LocalMultiBinding: Binding.LocalMultiBinding<KS>,

    // Expression nodes
    ApplicationExpression: Expression.ApplicationExpression<KS>,
    BooleanLiteralExpression: Expression.BooleanLiteralExpression,
    ExtensionExpression: Expression.ExtensionExpression,
    FieldExpression: Expression.FieldExpression<KS>,
    GlobalReferenceExpression: Expression.GlobalReferenceExpression,
    ImportExpression: Expression.ImportExpression,
    // LambdaExpression: Expression.LambdaExpression<KS>,
    ListExpression: Expression.ListExpression<KS>,
    LocalReferenceExpression: Expression.LocalReferenceExpression,
    MemberExpression: Expression.MemberExpression<KS>,
    ModuleExpression: Expression.ModuleExpression<KS>,
    NotExpression: Expression.NotExpression<KS>,
    NullLiteralExpression: Expression.NullLiteralExpression,
    NumericLiteralExpression: Expression.NumericLiteralExpression,
    ParenthesisedExpression: Expression.ParenthesisedExpression<KS>,
    QuantifiedExpression: Expression.QuantifiedExpression<KS>,
    RecordExpression: Expression.RecordExpression<KS>,
    SelectionExpression: Expression.SelectionExpression<KS>,
    SequenceExpression: Expression.SequenceExpression<KS>,
    StringLiteralExpression: Expression.StringLiteralExpression,
}[KS];
