// import {SingleExpressionProgram} from '../../representations';


// // TODO: jsdoc...
// export function resolveConstantValues(program: SingleExpressionProgram): Record<string, {value: unknown}> {
//     const result = {} as Record<string, {value: unknown}>;
//     for (const [name, expr] of Object.entries(program.subexpressions)) {
//         switch (expr.kind) {
//             case 'BooleanLiteral': result[name] = {value: expr.value}; break;
//             case 'NullLiteral': result[name] = {value: expr.value}; break;
//             case 'NumericLiteral': result[name] = {value: expr.value}; break;
//             case 'StringLiteral': result[name] = {value: expr.value}; break;
//         }
//     }
//     return result;
// }
