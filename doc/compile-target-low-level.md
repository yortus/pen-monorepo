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
// ==========  v:\oss\penc\test\fixtures\math.pen  ==========
import * as ℙ from "penlib;"
import * as a_pen from "./import-graph/a.pen";
import * as import_graph from "./import-graph";
import * as pen from "pen";

export default (function getModule() {
    let self = getModule.cached;
    if (self) return self;
    
    self = getModule.cached = {
        foo: ℙ.declare();
        rec: ℙ.declare();
        Memoize: ℙ.declare();
        i32: ℙ.declare();
        math: ℙ.declare();
        expr: ℙ.declare();
        add: ℙ.declare();
        sub: ℙ.declare();
        term: ℙ.declare();
        mul: ℙ.declare();
        div: ℙ.declare();
        factor: ℙ.declare();
        
    };
    
    
    ℙ.define(
        self.foo,
        <expression>
    );
    
    // TODO: define...
    
    // TODO: define...
    
    ℙ.define(
        self.math,
        expr
    );
    
    ℙ.define(
        self.expr,
        Memoize(
            <expression>
        )
    );
    
    ℙ.define(
        self.add,
        <expression>
    );
    
    ℙ.define(
        self.sub,
        <expression>
    );
    
    ℙ.define(
        self.term,
        Memoize(
            <expression>
        )
    );
    
    ℙ.define(
        self.mul,
        <expression>
    );
    
    ℙ.define(
        self.div,
        <expression>
    );
    
    ℙ.define(
        self.factor,
        Selection(
            i32,
            Sequence(
                "(",
                expr,
                ")"
            )
        )
    );
    return self;
    
});


// ==========  v:\oss\penc\test\fixtures\import-graph\a.pen  ==========
import * as ℙ from "penlib;"
import * as c from "./c";
import * as b_pen from "./b.pen";

export default (function getModule() {
    let self = getModule.cached;
    if (self) return self;
    
    self = getModule.cached = {
        
    };
    
    
    // TODO: define...
    
    // TODO: define...
    return self;
    
});


// ==========  v:\oss\penc\test\fixtures\import-graph\index.pen  ==========
import * as ℙ from "penlib;"
import * as a from "./a";
import * as b_pen from "./b.pen";

export default (function getModule() {
    let self = getModule.cached;
    if (self) return self;
    
    self = getModule.cached = {
        foo: ℙ.declare();
        bar: ℙ.declare();
        baz: ℙ.declare();
        rec: ℙ.declare();
        r2: ℙ.declare();
        r2d: ℙ.declare();
        
    };
    
    
    // TODO: define...
    
    // TODO: define...
    
    ℙ.define(
        self.rec,
        <expression>
    );
    
    ℙ.define(
        self.r2,
        rec
    );
    
    ℙ.define(
        self.r2d,
        <expression>
    );
    return self;
    
});


// ==========  v:\oss\penc\penlib\penlib.pen  ==========
import * as ℙ from "penlib;"

export default (function getModule() {
    let self = getModule.cached;
    if (self) return self;
    
    self = getModule.cached = {
        
    };
    
    return self;
    
});


// ==========  v:\oss\penc\test\fixtures\import-graph\c.pen  ==========
import * as ℙ from "penlib;"
import * as a_pen from "./a.pen";
import * as c from "./c";
import * as d from "./d";

export default (function getModule() {
    let self = getModule.cached;
    if (self) return self;
    
    self = getModule.cached = {
        
    };
    
    
    // TODO: define...
    
    // TODO: define...
    
    // TODO: define...
    return self;
    
});


// ==========  v:\oss\penc\test\fixtures\import-graph\b.pen  ==========
import * as ℙ from "penlib;"
import * as c from "./c";
import * as b from "./b";

export default (function getModule() {
    let self = getModule.cached;
    if (self) return self;
    
    self = getModule.cached = {
        
    };
    
    
    // TODO: define...
    
    // TODO: define...
    return self;
    
});


// ==========  v:\oss\penc\test\fixtures\import-graph\d.pen  ==========
import * as ℙ from "penlib;"
import * as pen from "pen";
import * as util from "./util";

export default (function getModule() {
    let self = getModule.cached;
    if (self) return self;
    
    self = getModule.cached = {
        
    };
    
    
    // TODO: define...
    
    // TODO: define...
    return self;
    
});


// ==========  v:\oss\penc\test\fixtures\import-graph\util\index.pen  ==========
import * as ℙ from "penlib;"
import * as util1 from "./util1";
import * as util2 from "./util2";

export default (function getModule() {
    let self = getModule.cached;
    if (self) return self;
    
    self = getModule.cached = {
        util: ℙ.declare();
        
    };
    
    
    ℙ.define(
        self.util,
        <expression>
    );
    return self;
    
});


// ==========  v:\oss\penc\test\fixtures\import-graph\util\util1.pen  ==========
import * as ℙ from "penlib;"

export default (function getModule() {
    let self = getModule.cached;
    if (self) return self;
    
    self = getModule.cached = {
        util1: ℙ.declare();
        
    };
    
    
    ℙ.define(
        self.util1,
        "util1"
    );
    return self;
    
});


// ==========  v:\oss\penc\test\fixtures\import-graph\util\util2  ==========
import * as ℙ from "penlib;"

export default (function getModule() {
    let self = getModule.cached;
    if (self) return self;
    
    self = getModule.cached = {
        util2: ℙ.declare();
        
    };
    
    
    ℙ.define(
        self.util2,
        "util2"
    );
    return self;
    
});
```
