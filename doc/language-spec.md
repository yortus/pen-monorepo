# PEN Language Specification


## Packages and Modules
- A pen package is a unit of distributable functionality. Each package contains a hierarchy of modules (commonly just a single exposed module).
- A pen package is a directory containing a `pen-package.json` file. Packages may *not* be nested in other packages.
- A pen module is a unit of referenceable functionality. Every pen module is a file or directory within a package.
- Directory modules may contain nested modules, whereas file modules are always 'leaf' modules containing no nested modules.
- The declarations for a directory module are in its `index.pen` file. All other files within a directory module are nested modules.
- A directory with no `index.pen` file is just a container for nested modules, with no declarations of its own.
- Modules do not have names. They are referred to by *module specifiers*, which map directly to their file path. There are several kinds of module specifier, which are described later.
- File/directory naming style is not mandated (apart from `index.pen`). Best practice is to use all lowercase with hyphens, ie kebab-case.


## Visibility within a package
- There are two levels of visibility: public and private. Every declaration and module is either public or private.
- Modules and module declarations are public by default.
- Public declarations are visible to all modules and declarations within the containing package.
- Private declarations are not visible outside their module. They *are* visible to all declarations inside the module, including within nested modules.
- A top-level declaration within a module may be marked as private by prepending the `private` keyword to the declaration.
- An entire module may be marked as private by specifying the `private module` declaration as the first declaration in the module. NB: for directory modules, this declaration goes in the directory's `index.pen` file.


## Visibility outside a package (package exports)
- Every package exports a single module from within the package. Since modules may be nested, this also allows for module hierarchies to be exported.
- A package's 'exports' are determined by the `"exports"` property in the package's `pen-package.json` file.
- The `"exports"` property is expected to be a relative module specifier that specifies a module within the package. Either a file or a directory module may be specified.
- If the `"exports"` property is not specified, it defaults to `"./index.pen"`. I.e., the package directory as a whole is taken to be the exported module.
- TODO: 


## Module specifiers
- used by `import` declarations
TODO: types of module specifier:
- internal module specifiers:
  - (i) file-relative (relative to importing module, start with `./` or `../`)
  - (ii) package-relative (relative to package root, start with `self/`)
- external module specifiers:
  - (iii) standard library / third-party (start with package name, may have path to public module within package)
- illegal / not supported module specifiers:
  - absolute file paths
  - URLs


## `import` declarations
```
// TODO: examples:
import './my-module' as MyModule    // import whole module as a namespace
import './my-module' as {File}      // import selected declarations via destructuring
                                    // TODO: destructuring with renaming
                                    // TODO: re-exports


A = MyModule.File
B = File
```















---
TODO: older docs below... review...



## Modules

NB: one file equals one module, like in ES6+

#### Module Declaration
- TODO...

#### Module Definition
- TODO: rename to: native module, ...?
- TODO...



## ~Declarations~

#### Definition
- TODO...

#### Import Declaration
- aliases...
- TODO...




## Expressions

#### Application
- no whitespace between function and argument(s) - this ensures no ambiguity between application and sequence
- use parentheses if necessary to ensure no whitespace
- TODO...

#### Block
- introduces a scope
- names defined inside a block are not visible outside the block
- names visible outside a block are also visible inside the block
- must have a `start` name defined inside the block

#### Character Range
- Syntax for both concrete and abstract character ranges, same as for string literals
- Examples: `"a-f"`, `"0-9"`, `'A-Z'`

#### Function
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
