import {expect} from 'chai';
import * as path from 'path';
import {compile, CompilerOptions} from '..';


describe('compile', () => {
    it('passes', () => {
        let fixture = ['import-graph', 'json', 'math', 'test'][3];
        let main = path.join(__dirname, `../../test/fixtures/${fixture}`);
        let outDir = path.join(__dirname, `../../dist/out/${fixture}`);
        let options: CompilerOptions = {main, outDir};
        let result = compile(options);
        expect(result).to.be.a('string');
        // TODO: was... expect(result).to.include({kind: 'Program'});
    });

    it('TESTING', () => {





        let __lexenv = {} as any; //__std.globalEnv;

        const myModule = ((() => {
            // Lazily define all bindings in this module.
            let bindings = {};
            let outerEnv = __lexenv;
            {
                __lexenv = Object.create(outerEnv);

                // TODO: emit for ModulePattern...

                Object.defineProperty(bindings, 'a', {
                    configurable: true,
                    enumerable: true,
                    get: () => {
                        const value = {};
                        Object.defineProperty(bindings, 'a', {enumerable: true, value});
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
                                        enumerable: true,
                                        get: () => {
                                            const value = {};
                                            Object.defineProperty(bindings, 'a1', {enumerable: true, value});
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
                    enumerable: true,
                    get: () => {
                        const value = {};
                        Object.defineProperty(bindings, 'b', {enumerable: true, value});
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
                                        enumerable: true,
                                        get: () => {
                                            const value = {};
                                            Object.defineProperty(bindings, 'b1', {enumerable: true, value});
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



        let a = myModule.bindings.a;
        let a1 = a.bindings.a1;
        [] = [a1];










    });
});
