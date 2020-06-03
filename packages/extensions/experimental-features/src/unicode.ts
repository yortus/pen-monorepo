function unicode(options: StaticOptions): PenVal {
    return {
        lambda(expr) {
            // TODO: temp hack to unmangle binding names... fix this
            let bindings = Object.keys(expr.bindings ?? {}).reduce(
                (obj: any, key: string) => {
                    let name = key.slice(key.indexOf('_') + 1);
                    obj[name] = expr.bindings?.[key];
                    return obj;
                },
                {} as any
            );
            let base = bindings.base?.constant?.value as number;
            let minDigits = bindings.minDigits?.constant?.value as number;
            let maxDigits = bindings.maxDigits?.constant?.value as number;
            assert(typeof base === 'number' && base >= 2 && base <= 36);
            assert(typeof minDigits === 'number' && minDigits >= 1 && minDigits <= 8);
            assert(typeof maxDigits === 'number' && maxDigits >= minDigits && maxDigits <= 8);

            // Construct a regex to match the digits
            let pattern = `[0-${base < 10 ? base - 1 : 9}${base > 10 ? `a-${String.fromCharCode('a'.charCodeAt(0) + base - 11)}` : ''}]`;
            let regex = RegExp(pattern, 'i');

            if (options.inForm === 'txt' || options.outForm === 'ast') {
                return {
                    rule: function UNI() {
                        if (typeof IN !== 'string') return false;
                        let stateₒ = getState();
                        const LEN = IN.length;
                        const EOS = '';

                        let len = 0;
                        let num = ''; // TODO: fix this - should actually keep count
                        let c = IP < LEN ? IN.charAt(IP) : EOS;
                        while (true) {
                            if (!regex.test(c)) break;
                            num += c;
                            IP += 1;
                            len += 1;
                            if (len === maxDigits) break;
                            c = IP < LEN ? IN.charAt(IP) : EOS;
                        }

                        if (len < minDigits) return setState(stateₒ), false;
                        // tslint:disable-next-line: no-eval
                        OUT = eval(`"\\u{${num}}"`); // TODO: hacky... fix when we have a charCode
                        return true;
                    },
                };
            }

            if (options.inForm === 'ast' || options.outForm === 'txt') {
                return {
                    rule: function UNI() {
                        // TODO: implement
                        return false;
                    },
                };
            }

            throw new Error(`Unsupported operation '${options.inForm}'->'${options.outForm}'`);
        },
    };
}
