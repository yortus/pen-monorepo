function apply(lambda: Lambda, arg: Datatype): Datatype {
    assert(lambda.kind === 'lambda');
    return lambda.apply(arg);
}
