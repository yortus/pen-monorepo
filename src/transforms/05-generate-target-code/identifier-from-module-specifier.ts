import * as path from 'path';


export function identifierFromModuleSpecifier(modspec: string) {
    let id = path.basename(modspec);
    id = id.replace(/[^a-zA-Z0-9]/g, '_');
    return id;
}
