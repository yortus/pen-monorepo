function apply(func: Function_, arg: Function_ | Module | Production): Function_ | Module | Production {
    assert(func.kind === 'function');
    return func.apply(arg);
}
