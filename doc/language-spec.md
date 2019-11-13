# PEN Language Specification



## Packages

- Useful references:
  - https://en.wikipedia.org/wiki/Package_manager
- A package is a unit of distributable functionality.
- A package is identified by its *package name*, which is a string.
- A package may declare dependencies on other packages.
- A package exports declarations from its implementation.
- Package implementation:
  - A package is a directory containing a `pen-package.json` file, which contains metadata about the package.
  - A package contains a hierarchy of modules. Every file and directory under a package's directory is a module within that package.
  - A single module within the package is nominated to provide the package's exports.
  - A package may *not* contain nested packages.
- TODO: package name format & uniqueness, package registries



## Modules

- A module is a unit of referenceable functionality within a package. Every file and directory under a package's directory is a module within that package.
- Directory modules may contain nested modules, whereas file modules are always 'leaf' modules containing no nested modules.
- The declarations for a directory module are in its `index.pen` file. All other entries within a directory module are nested modules.
- A directory with no `index.pen` file is just a container for nested modules, with no declarations of its own.
- Modules do not have names. They are referred to by *module specifiers*, which map directly to their file path. There are several kinds of module specifier, which are described later.
- A module cannot have both a file module and a directory module at the same path (eg cannot have both a `./src/foo.pen` file and a `./src/foo/` directory).
- File/directory naming style is not mandated (apart from `index.pen`). Best practice is to use kebab-case (i.e. all lowercase with hyphens).




## Visibility
- Visibility within a package:
  - A package's modules are visible to other modules within the same package.
  - A module's declarations are private to that module by default. Private declarations are not visible outside their containing file and cannot be imported by other modules.
  - A module specifies its externally-visible (i.e. exported) declarations by using a single `export = ...` binding declaration.
  - A module specifies which externally-defined declarations are visible *inside* the module by using zero or more `... = import '...'` binding declarations.
  - Thus, *every* identifier that is in scope within a module file appears explicitly in the LHS of a binding declaration within that file.
- Visibility outside a package (package exports)
  - A package's modules are not visible outside the package.
  - The declarations exported from a package are determined by the `"export"` property in the package's `pen-package.json` file.
  - The `"export"` property is expected to be a relative module specifier that specifies a module within the package. Either a file or a directory module may be specified.
  - If the `"export"` property is not specified, it defaults to `"./index.pen"`. i.e., the package directory as a whole is taken to be the exported module.
  - The declarations exported from the package are the exports of the module referred to by the `"export"` property in `pen-package.json`.




## Module specifiers
- used by `import` binding declarations and in the `"export"` property of `pen-package.json`
- internal module specifiers:
  - (i) file-relative
    - start with `./` or `../`
    - relative to the directory containing the importing module
    - must reference a module within the same package
    - cyclic dependencies are allowed
  - (ii) package-relative
    - start with `package/` (or just `package` to import the package's exports)
    - relative to the directory containing the module specified in the `"export"` property in the `pen-package.json` file
    - must reference a module within the same package
    - cyclic dependencies are allowed
- external module specifiers:
  - (iii) standard library / third-party package
    - specifies the name of a built-in package, or the name of a package published to the configured package registry.
    - cannot start with `.` or `package` (reserved for internal module specifiers - see above)
- illegal / not supported module specifiers:
  - absolute file paths
  - URLs


## Referencing external declarations within a module
```
// Examples:
FooBar = import './foobar'     // import whole module as a namespace
{Foo, Bar} = import './foobar' // import selected declarations via destructuring
{F = Foo} = import './foobar'  // destructuring with renaming

A = FooBar.Foo                 // namespace member access
```



## Module layout
- layout is non-mandated
- best practice is:
  2. import declarations
  3. export declaration
  4. implementation declarations


## TODO: ambient module declarations
- They are completely ambient (ie no emit). They describe the exports of a module written in the host language.
- They are differentiated by file extension `.d.pen`. Although is it better to do it another way?











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
