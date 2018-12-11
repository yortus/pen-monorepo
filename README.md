#### Let bindings, Names, and Scopes
```
let Id = Identifier in

    OpenTag(Id) Content CloseTag(Id)

```



#### Main Expression Types
```
Record
    child nodes = array of:
        RecordProperty
        SpreadProperty
        NonStructuralExpression
            Predicate
            ElidedString (-StrExpr-)
Tuple
    child nodes = array of:
        TupleElement
        SpreadElement
        NonStructuralExpression
            Predicate
            ElidedString (-StrExpr-)
String
    StringLiteral
    CharacterClass
    CharacterWildward
Number
    Int32
    Int64
    Float32
    Float64
Boolean
    true
    false
Unit
    ()
```

#### Main Control Flow
```
Sequence
    StringSequence
Selection
Iteration
    StringIteration
Predicate
    PositivePredicate (if T)
    NegativePredicate (ifnot T)
// let binding
// lambda/function expresion
```




## Types

Given expressions `E`, `E1`, and `E2` with types `T`, `T1` and `T2` respectively:

#### Selection
`E1 | E2` has type `T1 | T2`

#### Sequence
The type of the sequence `E1 E2` is:
- when `T1 = string`:
    - when `T2 = string` then `string`
    - else when `T2 = void` then `string`
    - else `error`
- else when `T1 = 


