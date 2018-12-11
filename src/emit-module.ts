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




export function emitModule(module: Module): ts.Statement[] {
    let stmts = [] as ts.Statement[];
    for (let {id, expression} of module.bindings) {
        let funcDecl = ts.createFunctionDeclaration(
            /*decorators*/ undefined,
            /*modifiers*/ undefined,
            /*asteriskToken*/ undefined,
            /*name*/ id.name,
            /*typeParameters*/ undefined,
            /*parameters*/ [
                ts.createParameter(undefined, undefined, undefined, 'state'),
            ],
            /*type*/ undefined,
            /*body*/ ts.createBlock(
                /*statements*/ [
                    ts.createReturn(
                        ts.createCall(
                            /*expression*/ ts.createPropertyAccess(
                                ts.createIdentifier(id.name),
                                'start'
                            ),
                            /*typeArguments*/ undefined,
                            /*argumentsArray*/ [
                                ts.createIdentifier('state'),
                            ]
                        )
                    ),
                ],
                /*multiline*/ true
            )
        );

        let propStmt = ts.createExpressionStatement(
            ts.createAssignment(
                /*left*/ ts.createPropertyAccess(
                    ts.createIdentifier(id.name),
                    'start'
                ),
                /*right*/ emitExpression(expression)
            )
        );

        ts.addSyntheticLeadingComment(funcDecl, ts.SyntaxKind.SingleLineCommentTrivia, ` ${id.name}`, true);
        stmts.push(funcDecl, propStmt);
    }
    return stmts;
}

function emitExpression(expr: Expression): ts.Expression {
    switch (expr.nodeType) {
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
    return ts.createCall(
        ts.createIdentifier('Record'),
        /*typeArguments*/ undefined,
        /*argumentsArray*/ [
            ts.createArrayLiteral(
                expr.fields.map(field => {
                    return ts.createObjectLiteral(
                        [
                            ts.createPropertyAssignment(
                                /*name*/ 'id',
                                /*initializer*/ ts.createStringLiteral(field.id.name)
                            ),
                            ts.createPropertyAssignment(
                                /*name*/ 'expression',
                                /*initializer*/ emitExpression(field.expression)
                            ),
                        ],
                        /*multiline*/ true
                    );
                }),
                /*multiline*/ true
            ),
        ]
    );
}

function emitSelection(expr: Selection) {
    return ts.createCall(
        ts.createIdentifier('Selection'),
        /*typeArguments*/ undefined,
        /*argumentsArray*/ expr.expressions.map(emitExpression)
    );
}

function emitSequence(expr: Sequence) {
    return ts.createCall(
        ts.createIdentifier('Sequence'),
        /*typeArguments*/ undefined,
        /*argumentsArray*/ expr.expressions.map(emitExpression)
    );
}

function emitStringLiteral(expr: StringLiteral) {
    return ts.createCall(
        ts.createIdentifier(`${expr.variant}StringLiteral`),
        /*typeArguments*/ undefined,
        /*argumentsArray*/ [
            ts.createStringLiteral(expr.value),
        ]
    );
}