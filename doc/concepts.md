
module - a file containing bindings. When imported, it is seen as a namespace

namespace - a set of statically-known bindings (name/value pairs). Each binding can be exported or internal

binding - a statically-known name/value pair eg `foo = a b | c d`

pattern
    namespace pattern - statically matches some of the bindings in a namespace (with optional renaming)
    tuple pattern - statically matches some of the elements in a tuple. eg for accepting params in a function

expression - a rule, function, or namespace

record - a rule for mapping between text and a particular record structure (field/value pairs) during parsing/unparsing

field - a name/value pair within a record

list - a rule for mapping between text and a particular list structure (0..M homogeneous elements) during parsing/unparsing

element - a value within a list

tuple - [FUTURE] TODO: static concept only. eg for passing args to functions

rule - a mapping between text and a particular data structure during parsing/unparsing

function - TODO static concept only, like generics/templates. eg define a static mapping from rule(s) to rule(s)
