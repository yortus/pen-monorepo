namespace sys {
    export function apply(lambda: PenVal, arg: PenVal): PenVal {
        return lambda.apply(arg);
    }
}
