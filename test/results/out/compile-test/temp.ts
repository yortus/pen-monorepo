// tslint:disable: all


// ==========  V:\projects\oss\penc\test\results\in\compile-test\index.pen  ==========
//import * as __std from "penlib;"

let __lexenv = {} as any; //__std.globalEnv;

export default ((() => {
    // Lazily define all bindings in this module.
    let bindings = {};
    let outerEnv = __lexenv;
    {
        __lexenv = Object.create(outerEnv);

        Object.defineProperty(bindings, 'aaa', {
            enumerable: true,
            configurable: true,
            get: () => {
                const value = {};
                Object.defineProperty(bindings, 'aaa', {enumerable: true, value});
                Object.assign(
                    value,
                    __lexenv.bbb,
                );
                return value;
            },
        });

        Object.defineProperty(bindings, 'bbb', {
            enumerable: true,
            configurable: true,
            get: () => {
                const value = {};
                Object.defineProperty(bindings, 'bbb', {enumerable: true, value});
                Object.assign(
                    value,
                    "blah",
                );
                return value;
            },
        });

        Object.assign(__lexenv, bindings);
    }
    return {bindings} as any;
})());