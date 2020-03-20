function apply(func: Function_, arg: Datatype): Datatype {
    assert(func.kind === 'function');
    return func.apply(arg);
}
