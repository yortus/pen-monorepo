import type {Expression} from './expression';
import type {Module} from './module';


// TODO: jsdoc...
export interface Definition {
    readonly kind: 'Definition';
    readonly definitionId: number;
    readonly moduleId: string;
    readonly localName: string; // maybe???
    // TODO: ...readonly globalName: string; // maybe???
    readonly value: Expression | Module;
}
