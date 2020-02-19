// tslint:disable: all


// ==========  v:\projects\oss\penc\test\fixtures\test.pen  ==========
//import * as __std from "penlib;"
//import * as __pen from "pen";

let __lexenv = {} as any; //__std.globalEnv;

export default ((() => {
    // Lazily define all bindings in this module.
    let bindings = {};
    let outerEnv = __lexenv;
    {
        __lexenv = Object.create(outerEnv);

        // TODO: emit for ModulePattern...

        Object.defineProperty(bindings, 'a', {
            configurable: true,
            get: () => {
                const value = {};
                Object.defineProperty(bindings, 'a', {value});
                Object.assign(
                    value,
                    ((() => {
                        // Lazily define all bindings in this module.
                        let bindings = {};
                        let outerEnv = __lexenv;
                        {
                            __lexenv = Object.create(outerEnv);

                            Object.defineProperty(bindings, 'a1', {
                                configurable: true,
                                get: () => {
                                    const value = {};
                                    Object.defineProperty(bindings, 'a1', {value});
                                    Object.assign(
                                        value,
                                        (__lexenv.b).bindings.b1,
                                    );
                                    return value;
                                },
                            });
                            Object.assign(__lexenv, bindings);
                        }
                        return {bindings} as any;
                    })()),
                );
                return value;
            },
        });

        Object.defineProperty(bindings, 'b', {
            configurable: true,
            get: () => {
                const value = {};
                Object.defineProperty(bindings, 'b', {value});
                Object.assign(
                    value,
                    ((() => {
                        // Lazily define all bindings in this module.
                        let bindings = {};
                        let outerEnv = __lexenv;
                        {
                            __lexenv = Object.create(outerEnv);

                            Object.defineProperty(bindings, 'b1', {
                                configurable: true,
                                get: () => {
                                    const value = {};
                                    Object.defineProperty(bindings, 'b1', {value});
                                    Object.assign(
                                        value,
                                        (__lexenv.a).bindings.a1,
                                    );
                                    return value;
                                },
                            });
                            Object.assign(__lexenv, bindings);
                        }
                        return {bindings} as any;
                    })()),
                );
                return value;
            },
        });
        Object.assign(__lexenv, bindings);
    }
    return {bindings} as any;
})());
