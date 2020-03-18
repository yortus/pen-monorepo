function bindingLookup(module: Module, name: string): Function_ | Module | Production {
    assert(module.kind === 'module' && module.bindings?.[name]);
    // TODO: ensure binding is exported/visible
    return module.bindings[name];
}
