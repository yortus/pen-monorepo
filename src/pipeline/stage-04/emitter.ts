export interface Emitter {
    text(s: string): this;
    nl(indentChange?: number): this;
    toString(): string;
}


export function makeEmitter() {
    let parts = [] as string[];
    let indent = 0;
    let emitter: Emitter = {
        text(s) {
            parts.push(s);
            return emitter;
        },
        nl(indentChange = 0) {
            indent += indentChange;
            parts.push('\n', '    '.repeat(indent));
            return emitter;
        },
        toString: () => parts.join(''),
    };
    return emitter;
}
