import type {V} from '../../representations';


// TODO: jsdoc...
// TODO: this isn't a transform in its current form... revise this...
export function resolveConstantValues(ast: V.AST<400>): Record<string, {value: unknown}> {
    const result = {} as Record<string, {value: unknown}>;
    for (const [name, value] of Object.entries(ast.start.bindings)) {
        switch (value.kind) {
            case 'BooleanLiteral': result[name] = {value: value.value}; break;
            case 'NullLiteral': result[name] = {value: value.value}; break;
            case 'NumericLiteral': result[name] = {value: value.value}; break;
            case 'StringLiteral': result[name] = {value: value.value}; break;
        }
    }
    return result;
}
