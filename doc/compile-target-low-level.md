This is the format emitted by `penc`. Conforming documents may also be written manually to provide 'native modules'.

Main points:
- the output format is TypeScript.
- ES module syntax is used in the output format
- Supported exports are *relations* and *functions*, as follows:
    ```ts
    interface Relation {
        kind: 'Relation',
        parse(src: string, pos: number, result: {ast: unknown, posᐟ: number}): boolean;
        unparse(ast: unknown, pos: number, result: {src: string, posᐟ: number}): boolean;
    }

    interface Function<P extends unknown[] = unknown[], R extends unknown = unknown> {
        kind: 'Function',
        apply(...args: P): R;
    }
    ```
- Multiple names bound to the same expression: use the same value in the output too



Example output file for `json.pen`:
```ts
// ==========  json.pen  ==========
import {Memoize, i32} from "pen";
import * as pen from "pen";


// 1. Declare all names up-front.
const start = {} as Relation;
const expr = {} as Relation;
export const add = {} as Relation;
export const sub = {} as Relation;
const term = {} as Relation;
const factor = {} as Relation;
const blahTest = {} as Relation;


// 2. Bind all names to their expressions.
define(
    start,
    expr // NB: this is still an empty object, but define() checks for that and adds a temporary indirection that will be backpatched
);
define(
    expr,
    Memoize(
        Selection(
            add,
            sub,
            term
        )
    )
);
define(
    add,
    Record([
        {
            computed: false,
            name: "type",
            value: AbstractStringLiteral("add")
        },
        {
            computed: false,
            name: "lhs",
            value: expr
        },
        {
            computed: false,
            name: "rhs",
            value: Sequence(
                ConcreteStringLiteral("+"),
                term
            )
        }
    ])
);
define(
    sub,
    Record([
        {
            computed: false,
            name: "type",
            value: AbstractStringLiteral("sub")
        },
        {
            computed: false,
            name: "lhs",
            value: expr
        },
        {
            computed: false,
            name: "rhs",
            value: Sequence(
                ConcreteStringLiteral("\\-"),
                term
            )
        }
    ])
);
define(
    term,
    // TODO: emit for a block... needs revision...
    (() => {
        const start = {} as Relation;
        const mul = {} as Relation;
        const div = {} as Relation;
        define(
            start,
            Memoize(
                Selection(
                    mul,
                    div,
                    factor
                )
            )
        );
        define(
            mul,
            Record([
                {
                    computed: false,
                    name: "type",
                    value: AbstractStringLiteral("mul")
                },
                {
                    computed: false,
                    name: "lhs",
                    value: term
                },
                {
                    computed: false,
                    name: "rhs",
                    value: Sequence(
                        ConcreteStringLiteral("*"),
                        factor
                    )
                }
            ])
        );
        define(
            div,
            Record([
                {
                    computed: false,
                    name: "type",
                    value: AbstractStringLiteral("div")
                },
                {
                    computed: false,
                    name: "lhs",
                    value: term
                },
                {
                    computed: false,
                    name: "rhs",
                    value: Sequence(
                        ConcreteStringLiteral("/"),
                        factor
                    )
                }
            ])
        );
        start.exports = {mul, div};
        return start;
    })()
);
define(
    factor,
    Selection(
        i32,
        Sequence(
            ConcreteStringLiteral("("),
            expr,
            ConcreteStringLiteral(")")
        )
    )
);
define(
    blahTest,
    Selection(
        term.exports.mul,
        term.exports.div,
        pen.exports.i32
    )
);
```




#### TODO: new output WIP
```ts
// ==========  v:\projects\oss\penc\test\fixtures\math.pen  ==========
import * as _0 from "pen";
const imports = {
    "pen": _0,
};
const {Memoize, i32} = imports["pen"]; // might still be undefined if imports are cyclic

import blah from './blah'; // default import



const foo: Rule = {
    parse(...args) {
        // replace parse/unparse functions with their targets on first call...
        define(foo, blah.foo); // will be defined by now, even if part of an import cycle
        return foo.parse(...args);
    },
    unparse(...args) {
        // replace parse/unparse functions with their targets on first call...
        define(foo, blah.foo); // will be defined by now, even if part of an import cycle
        return foo.unparse(...args);
    },
};



const math = {} as Rule;
const expr = {} as Rule;
const add = {} as Rule;
const sub = {} as Rule;
const term = {} as Rule;
const mul = {} as Rule;
const div = {} as Rule;
const factor = {} as Rule;


define(
    math,
    expr
);

define(
    expr,
    Memoize(
        <expression>
    )
);

define(
    add,
    <expression>
);

define(
    sub,
    <expression>
);

define(
    term,
    Memoize(
        <expression>
    )
);

define(
    mul,
    <expression>
);

define(
    div,
    <expression>
);

define(
    factor,
    Selection(
        i32,
        Sequence(
            "(",
            expr,
            ")"
        )
    )
);


// ==========  v:\projects\oss\penc\penlib\penlib.pen  ==========
const imports = {
    
};
```
