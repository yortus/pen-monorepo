# PEN Language Specification




## Modules

NB: one file equals one module, like in ES6+

#### Foreign Module
- TODO...

#### Pen Module
- TODO: rename to: native module, ...?
- TODO...



## Declarations

#### Definition
- TODO...

#### Import Declaration
- aliases...
- TODO...




## Expressions

#### Application
- no whitespace between function and argument(s) - this ensures no ambiguity between application and sequence
- TODO...

#### Block
- introduces a scope
- names defined inside a block are not visible outside the block
- names visible outside a block are also visible inside the block
- must have a `start` name defined inside the block

#### Character Range
- Syntax for both concrete and abstract character ranges, same as for string literals
- Examples: `"a-f"`, `"0-9"`, `'A-Z'`

#### Combinator
- TODO: rename to 'Function' or 'Function Expression'?
- TODO...

#### List Literal
- TODO...

#### Parenthetical
- TODO...

#### Record Literal
- TODO...

#### Reference
- TODO...

#### Sequence
- TODO...

#### Selection
- TODO...

#### String Literal
- use double quotes for concrete string literals (ie strings appearing in text but not in AST)
- use single quotes for abstract string literals (ie strings appearing in AST but not in text)
- some chars must be escaped (TODO: details on forms of escaping...)
- TODO: need syntax sugar or lib helper for 'isomorphic' strings - ie same in both text and AST

#### Void Literal
- like an epsilon rule
- TODO: equivalent to empty sequence / selection? which?
- parsing always succeeds without consuming anything
- unparsing always succeeds without producing anything
- used to signal... TODO: what? control flow? when used?
