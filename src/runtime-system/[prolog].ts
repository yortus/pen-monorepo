interface Function_ {
    kind: 'function';
    apply: (arg: Function_ | Module | Production) => Function_ | Module | Production;
}


interface Module {
    kind: 'module';
    bindings: Record<string, Function_ | Module | Production>;
}


/**
 * TODO: doc...
 * - modifies `result` iff return value is true -OR- if returns false, result may be garbage WHICH IS IT? 2nd is more flexible for impls
 * - meaning of `pos` and `posᐟ` for nodes is production-specific
 */
interface Production {
    kind: 'production';
    parse(text: string, pos: number, result: {node: unknown, posᐟ: number}): boolean;
    unparse(node: unknown, pos: number, result: {text: string, posᐟ: number}): boolean;
}
