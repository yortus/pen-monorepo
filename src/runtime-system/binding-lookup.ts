function bindingLookup(module: PenVal, name: string): PenVal {
    assert(module.bindings[name]);
    // TODO: ensure binding is exported/visible
    return module.bindings[name];
}
