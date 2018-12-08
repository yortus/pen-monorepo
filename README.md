


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


