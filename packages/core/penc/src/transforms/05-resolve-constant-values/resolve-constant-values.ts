import type {DefinitionMap} from '../../representations';


// TODO: jsdoc...
// TODO: this isn't a transform in its current form... revise this...
export function resolveConstantValues({definitions}: DefinitionMap): Record<string, {value: unknown}> {
    const result = {} as Record<string, {value: unknown}>;
    for (const [defnId, defn] of Object.entries(definitions)) {
        switch (defn.value.kind) {
            case 'BooleanLiteral': result[defnId] = {value: defn.value.value}; break;
            case 'NullLiteral': result[defnId] = {value: defn.value.value}; break;
            case 'NumericLiteral': result[defnId] = {value: defn.value.value}; break;
            case 'StringLiteral': result[defnId] = {value: defn.value.value}; break;
        }
    }
    return result;
}
