// TODO: declare all bindings with lazy getters (ie Object.defineProperty)
// - always inside 'Module' - since Module is the only node that introduces bindings
Object.defineProperty(__lexenv, 'propName', {
    configurable: true,
    enumerable: true,
    get: function self() {
        const __VALUE = __std.declare();

        Object.defineProperty(__lexenv, 'propName', {
            configurable: false,
            enumerable: true,
            writable: false,
            value: __VALUE,
        });

    },
});


// tslint:disable: all


// ==========  v:\projects\oss\penc\test\fixtures\test.pen  ==========
import * as __std from "penlib;"
import * as __pen from "pen";

let __lexenv = {} as any;

export default (
    function __module() {
        if (__module.cached) return __module.cached;

        // Declare all module-scoped variables.
        let self = __module.cached = {
            i32: __std.declare(),
            a: __std.declare(),
            b: __std.declare(),
        };

        // Enter a new nested lexical referencing environment.
        let outerEnv = __lexenv;
        __lexenv = Object.assign(Object.create(outerEnv), self);

        // TODO: define...

        __std.define(
            self.a,
            (
                function __module() {
                    if (__module.cached) return __module.cached;

                    // Declare all module-scoped variables.
                    let self = __module.cached = {
                        a1: __std.declare(),
                    };

                    // Enter a new nested lexical referencing environment.
                    let outerEnv = __lexenv;
                    __lexenv = Object.assign(Object.create(outerEnv), self);

                    __std.define(
                        self.a1,
                        (__lexenv.b).b1, // ReferenceError: 'b1' not defined on object yet...
                    );

                    // Restore previous lexical referencing environment before returning.
                    __lexenv = outerEnv;
                    return __module.cached;
                }
            )(),
        );

        __std.define(
            self.b,
            (
                function __module() {
                    if (__module.cached) return __module.cached;

                    // Declare all module-scoped variables.
                    let self = __module.cached = {
                        b1: __std.declare(),
                    };

                    // Enter a new nested lexical referencing environment.
                    let outerEnv = __lexenv;
                    __lexenv = Object.assign(Object.create(outerEnv), self);

                    __std.define(
                        self.b1,
                        (__lexenv.a).a1,
                    );

                    // Restore previous lexical referencing environment before returning.
                    __lexenv = outerEnv;
                    return __module.cached;
                }
            )(),
        );

        // Restore previous lexical referencing environment before returning.
        __lexenv = outerEnv;
        return __module.cached;
    }
);
