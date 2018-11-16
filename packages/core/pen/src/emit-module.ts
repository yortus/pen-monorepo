import * as ts from 'typescript';
import {Application} from './ast-types';
import {Expression} from './ast-types';
import {Identifier} from './ast-types';
import {Module} from './ast-types';
import {ParenthesizedExpression} from './ast-types';
import {Record} from './ast-types';
import {Selection} from './ast-types';
import {Sequence} from './ast-types';
import {StringLiteral} from './ast-types';
// import {visitEachChild} from './visit-each-child';




export function emitModule(module: Module) {
    let varStmts = module.bindings.map(binding => {
        let stmt = ts.createVariableStatement(
            /*modifiers*/undefined,
            ts.createVariableDeclarationList(
                [
                    ts.createVariableDeclaration(
                        /*name*/ binding.id.name,
                        /*type*/ undefined,
                        /*initializer*/ emitExpression(binding.value)
                    ),
                ],
                ts.NodeFlags.Const
            )
        );
        return stmt;
    });
    return varStmts;
}

function emitExpression(expr: Expression): ts.Expression {
    switch (expr.type) {
        case 'Application': return emitApplication(expr);
        case 'Identifier': return emitIdentifier(expr);
        case 'ParenthesizedExpression': return emitParenthesizedExpression(expr);
        case 'Record': return emitRecord(expr);
        case 'Selection': return emitSelection(expr);
        case 'Sequence': return emitSequence(expr);
        case 'StringLiteral': return emitStringLiteral(expr);
        default: return assertNever(expr);
    }

    function assertNever(_value: never): never {
        throw new Error(`Internal error: unhandled node type in emitExpression`);
    }
}

function emitApplication(expr: Application) {
    return ts.createCall(
        ts.createIdentifier(expr.id.name),
        /*typeArguments*/ undefined,
        /*argumentsArray*/ expr.arguments.map(emitExpression)
    );
}

function emitIdentifier(expr: Identifier) {
    return ts.createIdentifier(expr.name);
}

function emitParenthesizedExpression(expr: ParenthesizedExpression) {
    return emitExpression(expr.expression);
}

function emitRecord(expr: Record) {
    return ts.createObjectLiteral(
        /*properties*/ expr.fields.map(field => {
            return ts.createPropertyAssignment(
                /*name*/ field.id.name,
                /*initializer*/ emitExpression(field.value)
            );
        }),
        /*multiline*/ true
    );
    // type TT = ts.ObjectLiteralElementLike;

}

function emitSelection(expr: Selection) {
    return ts.createCall(
        ts.createIdentifier('selection'),
        /*typeArguments*/ undefined,
        /*argumentsArray*/ expr.expressions.map(emitExpression),
    );
}

function emitSequence(expr: Sequence) {
    return ts.createCall(
        ts.createIdentifier('sequence'),
        /*typeArguments*/ undefined,
        /*argumentsArray*/ expr.expressions.map(emitExpression)
    );
}

function emitStringLiteral(expr: StringLiteral) {
    return ts.createCall(
        ts.createIdentifier('stringLiteral'),
        /*typeArguments*/ undefined,
        /*argumentsArray*/ [
            ts.createStringLiteral(expr.value),
            expr.onlyIn === undefined
                ? ts.createVoidZero()
                : ts.createStringLiteral(expr.onlyIn),
        ]
    );
}







    // visitEachChild(module, function visitor(child) {
    //     switch (child.type) {
    //         case 'StringLiteral':
    //             strLits.push(child);
    //             break;
    //         default: break;
    //     }
    //     visitEachChild(child, visitor); // recurse
    // });
