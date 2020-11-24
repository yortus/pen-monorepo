import type {Expression} from './expression';
import type {ModuleStub} from './module';


// TODO: jsdoc...
export interface Definition {
    readonly kind: 'Definition';
    readonly definitionId: string;
    readonly moduleId: string;
    readonly localName: string; // maybe???
    // TODO: ...readonly globalName: string; // maybe???
    readonly value: Expression | ModuleStub;
}
