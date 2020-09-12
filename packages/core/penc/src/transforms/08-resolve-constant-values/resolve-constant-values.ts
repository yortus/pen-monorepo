import {FlatExpressionList} from '../07-create-flat-expression-list';


// TODO: jsdoc...
export function resolveConstantValues({flatList}: FlatExpressionList): Record<string, {value: unknown}> {
    let result = {} as Record<string, {value: unknown}>;
    for (let [name, expr] of Object.entries(flatList)) {
        switch (expr.kind) {
            case 'BooleanLiteralExpression': result[name] = {value: expr.value}; break;
            case 'NullLiteralExpression': result[name] = {value: expr.value}; break;
            case 'NumericLiteralExpression': result[name] = {value: expr.value}; break;
            case 'StringLiteralExpression': result[name] = {value: expr.value}; break;
        }
    }
    return result;
}
