import {Expression} from '../../ast-nodes';


// TODO: doc...
export function resolveConstantValues(il: Record<string, Expression>): Record<string, {value: unknown}> {
    let result = {} as Record<string, {value: unknown}>;
    for (let [name, expr] of Object.entries(il)) {
        switch (expr.kind) {
            case 'BooleanLiteralExpression': result[name] = {value: expr.value}; break;
            case 'NullLiteralExpression': result[name] = {value: expr.value}; break;
            case 'NumericLiteralExpression': result[name] = {value: expr.value}; break;
            case 'StringLiteralExpression': result[name] = {value: expr.value}; break;
        }
    }
    return result;
}
