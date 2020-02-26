## Scope Rules

#### Global scope

There is no global scope accessible by `pen` source code. Symbols must be `import`ed into source files.

#### Source file scope

- covers whole source file
- recall that a source file is a module, so this is really just a module scope (see below) with no outer scope.

#### Module scope
- recall that each source file is a module, and nested module expressions are also permitted.
- source code within a module may make unqualified references to symbols defined directly within that module.
- module expressions are weird and special in terms of scope, kind of like class decls/exprs in other langs. TODO: expand on this...

#### Function scope

- TODO: work on this later...



## Considerations for emit

- all statically-nested modules in a source file are given a unique mangled name so they can be referenced from emitted code.
- statically-nested modules in a source file exclude the source file module itself, and any modules defined inside function bodies.

- forward-references are always permitted.
- it must not matter in which order symbols are defined.
- due to the above two, all symbols, including members of module expressions, must be declared before any symbols are defined.

