export interface Emitter {
    line(s?: string): this;
    indent(): this;
    dedent(): this;
    toString(): string;
}




export function makeEmitter() {
    let lines = [] as string[];
    let prefix = '';
    let emitter: Emitter = {
        line(s = '') {
            lines.push(prefix + s);
            return emitter;
        },
        indent() {
            prefix += ' '.repeat(4);
            return emitter;
        },
        dedent() {
            prefix = prefix.slice(4);
            return emitter;
        },
        toString: () => lines.join('\n'),
    };
    return emitter;
}
