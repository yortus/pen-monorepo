// TODO: jsdoc...
export function createParamNameGenerator() {
    let counter = 0;
    return function generateParamName() {
        // Prefix module name with 'ℙ' to ensure it cannot clash with program identifiers.
        // TODO: but that could be a valid id in future... ensure *can't* clash
        return `ℙ${++counter}`;
    }
}
