export interface Emitter {
    down(n: number): this;
    indent(): this;
    dedent(): this;
    text(s: string): this;
    lines(s: string):this;
    toString(): string;
}


export function makeEmitter() {
    const parts = [] as string[];
    let indent = 0;

    const emitter: Emitter = {
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
        lines(s: string) {
            const lines = s.split(/\r\n|\r|\n/).map(line => line.trim()).filter(line => line.length > 0);
            for (const line of lines) {
                if ('}])'.includes(line[0])) this.dedent();
                this.down(1).text(line);
                if ('{[('.includes(line[line.length - 1])) this.indent();
            }
            return this;
        },
        toString() {
            return parts.join('');
        },
    };
    return emitter;
}
