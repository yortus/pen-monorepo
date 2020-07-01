export interface Emitter {
    down(n: number): this;
    indent(): this;
    dedent(): this;
    text(s: string): this;
    toString(): string;
}


export function makeEmitter() {
    let parts = [] as string[];
    let indent = 0;

    let emitter: Emitter = {
        down(n: number) {
            parts.push('\n'.repeat(n), '    '.repeat(indent));
            return this;
        },
        indent() {
            ++indent;
            return emitter;
        },
        dedent() {
            --indent;
            return emitter;
        },
        text(s: string) {
            parts.push(s);
            return emitter;
        },
        toString() {
            return parts.join('');
        },
    };
    return emitter;
}
