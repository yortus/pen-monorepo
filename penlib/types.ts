/* Bikeshed names:
- relation (sounds like some abstract math concept - could be confusing)
- rule
- pattern (too generic?)
- parser (one-sided - doesn't including unparsing)
- production (proper term for this. But one-sided? nah seems ok actually - same term used in both generative grammars and recognizers
- form
- combinator
- transducer
- axiom
- formula
- model
- shape
- schema
- definition
*/



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


interface Module {
    kind: 'module';
    bindings: Record<string, Production | Module>;
}


// TODO: interface Function {...}
