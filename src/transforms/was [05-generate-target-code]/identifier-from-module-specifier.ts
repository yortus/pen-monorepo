import * as path from 'path';


export function identifierFromModuleSpecifier(modspec: string) {
    // TODO: don't allow clashes with other compiler ids, eg __std
    let id = path.basename(modspec);
    id = id.replace(/[^a-zA-Z0-9]/g, '_');
    return '__' + id;
}
