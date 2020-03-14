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




interface Production {
    kind: 'production';
    parse(src: string, pos: number, result: {ast: unknown, posᐟ: number}): boolean;
    unparse(ast: unknown, pos: number, result: {src: string, posᐟ: number}): boolean;
}


interface Module {
    kind: 'module';
    bindings: Record<string, Production | Module>;
}


// TODO: interface Function {...}
