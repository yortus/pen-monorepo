import {SingleExpressionProgram} from '../../representations';


// TODO: jsdoc...
export function resolveConstantValues(program: SingleExpressionProgram): Record<string, {value: unknown}> {
    let result = {} as Record<string, {value: unknown}>;
    for (let [name, expr] of Object.entries(program.subexpressions)) {
        switch (expr.kind) {
            case 'BooleanLiteralExpression': result[name] = {value: expr.value}; break;
            case 'NullLiteralExpression': result[name] = {value: expr.value}; break;
            case 'NumericLiteralExpression': result[name] = {value: expr.value}; break;
            case 'StringLiteralExpression': result[name] = {value: expr.value}; break;
        }
    }
    return result;
}
