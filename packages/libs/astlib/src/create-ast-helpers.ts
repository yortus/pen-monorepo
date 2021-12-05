import {Narrow} from './util';

export interface CreateAstHelpersOptions<K extends string> {
    nodes: Record<K, unknown>;
    categories: Record<K, string>;
}

export interface AstHelpers<K extends string, Opts extends CreateAstHelpersOptions<K>> {
    opts: Opts;
    kinds: K;
}

export function createAstHelpers<K extends string, Opts extends CreateAstHelpersOptions<K>>(_options: Narrow<Opts>): AstHelpers<K, Opts> {
    throw new Error('not implemented');
}

export function child<C extends string>(_category: C): C {
    throw new Error('not implemented');
}
