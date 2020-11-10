// This is the ModuleMap representation (intermediate AST form) of the json.pen program.
// TODO: put this in an actual test to programatically test for regressions/ast changes.
// - would need to make the module IDs not machine-specific for that to work
let moduleMap = {
    modulesById: {
        "file://V:\\projects\\oss\\pen-monorepo\\packages\\test-suite\\fixtures\\pen-src\\json.pen": {
            kind: "Module",
            moduleId: "file://V:\\projects\\oss\\pen-monorepo\\packages\\test-suite\\fixtures\\pen-src\\json.pen",
            bindings: [
                {
                    kind: "Binding",
                    pattern: {
                        kind: "ModulePattern",
                        names: [
                            {
                                name: "char",
                            },
                            {
                                name: "f64",
                            },
                        ],
                    },
                    value: {
                        kind: "ImportExpression",
                        moduleSpecifier: "std",
                        moduleId: "file://V:\\projects\\oss\\pen-monorepo\\packages\\core\\penc\\dist\\deps\\std.pen.js",
                    },
                    exported: false,
                },
                {
                    kind: "Binding",
                    pattern: {
                        kind: "ModulePattern",
                        names: [
                            {
                                name: "unicode",
                            },
                        ],
                    },
                    value: {
                        kind: "ImportExpression",
                        moduleSpecifier: "experiments",
                        moduleId: "file://V:\\projects\\oss\\pen-monorepo\\packages\\core\\penc\\dist\\deps\\experiments.pen.js",
                    },
                    exported: false,
                },
                {
                    kind: "Binding",
                    pattern: {
                        kind: "NamePattern",
                        name: "start",
                    },
                    value: {
                        kind: "SequenceExpression",
                        expressions: [
                            {
                                kind: "NameExpression",
                                name: "WS",
                            },
                            {
                                kind: "NameExpression",
                                name: "Value",
                            },
                            {
                                kind: "NameExpression",
                                name: "WS",
                            },
                        ],
                    },
                    exported: false,
                },
                {
                    kind: "Binding",
                    pattern: {
                        kind: "NamePattern",
                        name: "Value",
                    },
                    value: {
                        kind: "SelectionExpression",
                        expressions: [
                            {
                                kind: "NameExpression",
                                name: "False",
                            },
                            {
                                kind: "NameExpression",
                                name: "Null",
                            },
                            {
                                kind: "NameExpression",
                                name: "True",
                            },
                            {
                                kind: "NameExpression",
                                name: "Object",
                            },
                            {
                                kind: "NameExpression",
                                name: "Array",
                            },
                            {
                                kind: "NameExpression",
                                name: "Number",
                            },
                            {
                                kind: "NameExpression",
                                name: "String",
                            },
                        ],
                    },
                    exported: false,
                },
                {
                    kind: "Binding",
                    pattern: {
                        kind: "NamePattern",
                        name: "False",
                    },
                    value: {
                        kind: "SequenceExpression",
                        expressions: [
                            {
                                kind: "StringLiteralExpression",
                                value: "false",
                                concrete: true,
                                abstract: false,
                            },
                            {
                                kind: "BooleanLiteralExpression",
                                value: false,
                            },
                        ],
                    },
                    exported: false,
                },
                {
                    kind: "Binding",
                    pattern: {
                        kind: "NamePattern",
                        name: "Null",
                    },
                    value: {
                        kind: "SequenceExpression",
                        expressions: [
                            {
                                kind: "StringLiteralExpression",
                                value: "null",
                                concrete: true,
                                abstract: false,
                            },
                            {
                                kind: "NullLiteralExpression",
                                value: null,
                            },
                        ],
                    },
                    exported: false,
                },
                {
                    kind: "Binding",
                    pattern: {
                        kind: "NamePattern",
                        name: "True",
                    },
                    value: {
                        kind: "SequenceExpression",
                        expressions: [
                            {
                                kind: "StringLiteralExpression",
                                value: "true",
                                concrete: true,
                                abstract: false,
                            },
                            {
                                kind: "BooleanLiteralExpression",
                                value: true,
                            },
                        ],
                    },
                    exported: false,
                },
                {
                    kind: "Binding",
                    pattern: {
                        kind: "NamePattern",
                        name: "Object",
                    },
                    value: {
                        kind: "SequenceExpression",
                        expressions: [
                            {
                                kind: "NameExpression",
                                name: "LBRACE",
                            },
                            {
                                kind: "ParenthesisedExpression",
                                expression: {
                                    kind: "SelectionExpression",
                                    expressions: [
                                        {
                                            kind: "SequenceExpression",
                                            expressions: [
                                                {
                                                    kind: "NameExpression",
                                                    name: "Property",
                                                },
                                                {
                                                    kind: "QuantifiedExpression",
                                                    expression: {
                                                        kind: "ParenthesisedExpression",
                                                        expression: {
                                                            kind: "SequenceExpression",
                                                            expressions: [
                                                                {
                                                                    kind: "NameExpression",
                                                                    name: "COMMA",
                                                                },
                                                                {
                                                                    kind: "NameExpression",
                                                                    name: "Property",
                                                                },
                                                            ],
                                                        },
                                                    },
                                                    quantifier: "*",
                                                },
                                            ],
                                        },
                                        {
                                            kind: "RecordExpression",
                                            fields: [
                                            ],
                                        },
                                    ],
                                },
                            },
                            {
                                kind: "NameExpression",
                                name: "RBRACE",
                            },
                        ],
                    },
                    exported: false,
                },
                {
                    kind: "Binding",
                    pattern: {
                        kind: "NamePattern",
                        name: "Property",
                    },
                    value: {
                        kind: "FieldExpression",
                        name: {
                            kind: "NameExpression",
                            name: "String",
                        },
                        value: {
                            kind: "SequenceExpression",
                            expressions: [
                                {
                                    kind: "NameExpression",
                                    name: "COLON",
                                },
                                {
                                    kind: "NameExpression",
                                    name: "Value",
                                },
                            ],
                        },
                    },
                    exported: false,
                },
                {
                    kind: "Binding",
                    pattern: {
                        kind: "NamePattern",
                        name: "Array",
                    },
                    value: {
                        kind: "SequenceExpression",
                        expressions: [
                            {
                                kind: "NameExpression",
                                name: "LBRACKET",
                            },
                            {
                                kind: "ParenthesisedExpression",
                                expression: {
                                    kind: "SelectionExpression",
                                    expressions: [
                                        {
                                            kind: "SequenceExpression",
                                            expressions: [
                                                {
                                                    kind: "NameExpression",
                                                    name: "Element",
                                                },
                                                {
                                                    kind: "QuantifiedExpression",
                                                    expression: {
                                                        kind: "ParenthesisedExpression",
                                                        expression: {
                                                            kind: "SequenceExpression",
                                                            expressions: [
                                                                {
                                                                    kind: "NameExpression",
                                                                    name: "COMMA",
                                                                },
                                                                {
                                                                    kind: "NameExpression",
                                                                    name: "Element",
                                                                },
                                                            ],
                                                        },
                                                    },
                                                    quantifier: "*",
                                                },
                                            ],
                                        },
                                        {
                                            kind: "ListExpression",
                                            elements: [
                                            ],
                                        },
                                    ],
                                },
                            },
                            {
                                kind: "NameExpression",
                                name: "RBRACKET",
                            },
                        ],
                    },
                    exported: false,
                },
                {
                    kind: "Binding",
                    pattern: {
                        kind: "NamePattern",
                        name: "Element",
                    },
                    value: {
                        kind: "ListExpression",
                        elements: [
                            {
                                kind: "NameExpression",
                                name: "Value",
                            },
                        ],
                    },
                    exported: false,
                },
                {
                    kind: "Binding",
                    pattern: {
                        kind: "NamePattern",
                        name: "Number",
                    },
                    value: {
                        kind: "NameExpression",
                        name: "f64",
                    },
                    exported: false,
                },
                {
                    kind: "Binding",
                    pattern: {
                        kind: "NamePattern",
                        name: "String",
                    },
                    value: {
                        kind: "SequenceExpression",
                        expressions: [
                            {
                                kind: "NameExpression",
                                name: "DOUBLE_QUOTE",
                            },
                            {
                                kind: "QuantifiedExpression",
                                expression: {
                                    kind: "NameExpression",
                                    name: "CHAR",
                                },
                                quantifier: "*",
                            },
                            {
                                kind: "NameExpression",
                                name: "DOUBLE_QUOTE",
                            },
                        ],
                    },
                    exported: false,
                },
                {
                    kind: "Binding",
                    pattern: {
                        kind: "NamePattern",
                        name: "CHAR",
                    },
                    value: {
                        kind: "SelectionExpression",
                        expressions: [
                            {
                                kind: "SequenceExpression",
                                expressions: [
                                    {
                                        kind: "NotExpression",
                                        expression: {
                                            kind: "StringLiteralExpression",
                                            value: "\\",
                                            concrete: false,
                                            abstract: false,
                                        },
                                    },
                                    {
                                        kind: "NotExpression",
                                        expression: {
                                            kind: "StringLiteralExpression",
                                            value: "\"",
                                            concrete: false,
                                            abstract: false,
                                        },
                                    },
                                    {
                                        kind: "ApplicationExpression",
                                        lambda: {
                                            kind: "NameExpression",
                                            name: "char",
                                        },
                                        argument: {
                                            kind: "ImportExpression",
                                            moduleSpecifier: "internal://2",
                                            moduleId: "internal://2",
                                        },
                                    },
                                ],
                            },
                            {
                                kind: "SequenceExpression",
                                expressions: [
                                    {
                                        kind: "StringLiteralExpression",
                                        value: "\\\"",
                                        concrete: true,
                                        abstract: false,
                                    },
                                    {
                                        kind: "StringLiteralExpression",
                                        value: "\"",
                                        concrete: false,
                                        abstract: true,
                                    },
                                ],
                            },
                            {
                                kind: "SequenceExpression",
                                expressions: [
                                    {
                                        kind: "StringLiteralExpression",
                                        value: "\\\\",
                                        concrete: true,
                                        abstract: false,
                                    },
                                    {
                                        kind: "StringLiteralExpression",
                                        value: "\\",
                                        concrete: false,
                                        abstract: true,
                                    },
                                ],
                            },
                            {
                                kind: "SequenceExpression",
                                expressions: [
                                    {
                                        kind: "StringLiteralExpression",
                                        value: "\\/",
                                        concrete: true,
                                        abstract: false,
                                    },
                                    {
                                        kind: "StringLiteralExpression",
                                        value: "/",
                                        concrete: false,
                                        abstract: true,
                                    },
                                ],
                            },
                            {
                                kind: "SequenceExpression",
                                expressions: [
                                    {
                                        kind: "StringLiteralExpression",
                                        value: "\\b",
                                        concrete: true,
                                        abstract: false,
                                    },
                                    {
                                        kind: "StringLiteralExpression",
                                        value: "\b",
                                        concrete: false,
                                        abstract: true,
                                    },
                                ],
                            },
                            {
                                kind: "SequenceExpression",
                                expressions: [
                                    {
                                        kind: "StringLiteralExpression",
                                        value: "\\f",
                                        concrete: true,
                                        abstract: false,
                                    },
                                    {
                                        kind: "StringLiteralExpression",
                                        value: "\f",
                                        concrete: false,
                                        abstract: true,
                                    },
                                ],
                            },
                            {
                                kind: "SequenceExpression",
                                expressions: [
                                    {
                                        kind: "StringLiteralExpression",
                                        value: "\\n",
                                        concrete: true,
                                        abstract: false,
                                    },
                                    {
                                        kind: "StringLiteralExpression",
                                        value: "\n",
                                        concrete: false,
                                        abstract: true,
                                    },
                                ],
                            },
                            {
                                kind: "SequenceExpression",
                                expressions: [
                                    {
                                        kind: "StringLiteralExpression",
                                        value: "\\r",
                                        concrete: true,
                                        abstract: false,
                                    },
                                    {
                                        kind: "StringLiteralExpression",
                                        value: "\r",
                                        concrete: false,
                                        abstract: true,
                                    },
                                ],
                            },
                            {
                                kind: "SequenceExpression",
                                expressions: [
                                    {
                                        kind: "StringLiteralExpression",
                                        value: "\\t",
                                        concrete: true,
                                        abstract: false,
                                    },
                                    {
                                        kind: "StringLiteralExpression",
                                        value: "\t",
                                        concrete: false,
                                        abstract: true,
                                    },
                                ],
                            },
                            {
                                kind: "SequenceExpression",
                                expressions: [
                                    {
                                        kind: "StringLiteralExpression",
                                        value: "\\u",
                                        concrete: true,
                                        abstract: false,
                                    },
                                    {
                                        kind: "ApplicationExpression",
                                        lambda: {
                                            kind: "NameExpression",
                                            name: "unicode",
                                        },
                                        argument: {
                                            kind: "ImportExpression",
                                            moduleSpecifier: "internal://3",
                                            moduleId: "internal://3",
                                        },
                                    },
                                ],
                            },
                        ],
                    },
                    exported: false,
                },
                {
                    kind: "Binding",
                    pattern: {
                        kind: "NamePattern",
                        name: "LBRACE",
                    },
                    value: {
                        kind: "SequenceExpression",
                        expressions: [
                            {
                                kind: "NameExpression",
                                name: "WS",
                            },
                            {
                                kind: "StringLiteralExpression",
                                value: "{",
                                concrete: true,
                                abstract: false,
                            },
                            {
                                kind: "NameExpression",
                                name: "WS",
                            },
                        ],
                    },
                    exported: false,
                },
                {
                    kind: "Binding",
                    pattern: {
                        kind: "NamePattern",
                        name: "RBRACE",
                    },
                    value: {
                        kind: "SequenceExpression",
                        expressions: [
                            {
                                kind: "NameExpression",
                                name: "WS",
                            },
                            {
                                kind: "StringLiteralExpression",
                                value: "}",
                                concrete: true,
                                abstract: false,
                            },
                            {
                                kind: "NameExpression",
                                name: "WS",
                            },
                        ],
                    },
                    exported: false,
                },
                {
                    kind: "Binding",
                    pattern: {
                        kind: "NamePattern",
                        name: "LBRACKET",
                    },
                    value: {
                        kind: "SequenceExpression",
                        expressions: [
                            {
                                kind: "NameExpression",
                                name: "WS",
                            },
                            {
                                kind: "StringLiteralExpression",
                                value: "[",
                                concrete: true,
                                abstract: false,
                            },
                            {
                                kind: "NameExpression",
                                name: "WS",
                            },
                        ],
                    },
                    exported: false,
                },
                {
                    kind: "Binding",
                    pattern: {
                        kind: "NamePattern",
                        name: "RBRACKET",
                    },
                    value: {
                        kind: "SequenceExpression",
                        expressions: [
                            {
                                kind: "NameExpression",
                                name: "WS",
                            },
                            {
                                kind: "StringLiteralExpression",
                                value: "]",
                                concrete: true,
                                abstract: false,
                            },
                            {
                                kind: "NameExpression",
                                name: "WS",
                            },
                        ],
                    },
                    exported: false,
                },
                {
                    kind: "Binding",
                    pattern: {
                        kind: "NamePattern",
                        name: "COLON",
                    },
                    value: {
                        kind: "SequenceExpression",
                        expressions: [
                            {
                                kind: "NameExpression",
                                name: "WS",
                            },
                            {
                                kind: "StringLiteralExpression",
                                value: ":",
                                concrete: true,
                                abstract: false,
                            },
                            {
                                kind: "NameExpression",
                                name: "WS",
                            },
                        ],
                    },
                    exported: false,
                },
                {
                    kind: "Binding",
                    pattern: {
                        kind: "NamePattern",
                        name: "COMMA",
                    },
                    value: {
                        kind: "SequenceExpression",
                        expressions: [
                            {
                                kind: "NameExpression",
                                name: "WS",
                            },
                            {
                                kind: "StringLiteralExpression",
                                value: ",",
                                concrete: true,
                                abstract: false,
                            },
                            {
                                kind: "NameExpression",
                                name: "WS",
                            },
                        ],
                    },
                    exported: false,
                },
                {
                    kind: "Binding",
                    pattern: {
                        kind: "NamePattern",
                        name: "DOUBLE_QUOTE",
                    },
                    value: {
                        kind: "StringLiteralExpression",
                        value: "\"",
                        concrete: true,
                        abstract: false,
                    },
                    exported: false,
                },
                {
                    kind: "Binding",
                    pattern: {
                        kind: "NamePattern",
                        name: "WS",
                    },
                    value: {
                        kind: "QuantifiedExpression",
                        expression: {
                            kind: "ParenthesisedExpression",
                            expression: {
                                kind: "SelectionExpression",
                                expressions: [
                                    {
                                        kind: "StringLiteralExpression",
                                        value: " ",
                                        concrete: true,
                                        abstract: false,
                                    },
                                    {
                                        kind: "StringLiteralExpression",
                                        value: "\t",
                                        concrete: true,
                                        abstract: false,
                                    },
                                    {
                                        kind: "StringLiteralExpression",
                                        value: "\n",
                                        concrete: true,
                                        abstract: false,
                                    },
                                    {
                                        kind: "StringLiteralExpression",
                                        value: "\r",
                                        concrete: true,
                                        abstract: false,
                                    },
                                ],
                            },
                        },
                        quantifier: "*",
                    },
                    exported: false,
                },
            ],
        },
        "internal://2": {
            kind: "Module",
            moduleId: "internal://2",
            parentModuleId: "file://V:\\projects\\oss\\pen-monorepo\\packages\\test-suite\\fixtures\\pen-src\\json.pen",
            bindings: [
                {
                    kind: "Binding",
                    pattern: {
                        kind: "NamePattern",
                        name: "min",
                    },
                    value: {
                        kind: "StringLiteralExpression",
                        value: " ",
                        concrete: false,
                        abstract: false,
                    },
                    exported: false,
                },
                {
                    kind: "Binding",
                    pattern: {
                        kind: "NamePattern",
                        name: "max",
                    },
                    value: {
                        kind: "StringLiteralExpression",
                        value: "￿",
                        concrete: false,
                        abstract: false,
                    },
                    exported: false,
                },
            ],
        },
        "internal://3": {
            kind: "Module",
            moduleId: "internal://3",
            parentModuleId: "file://V:\\projects\\oss\\pen-monorepo\\packages\\test-suite\\fixtures\\pen-src\\json.pen",
            bindings: [
                {
                    kind: "Binding",
                    pattern: {
                        kind: "NamePattern",
                        name: "base",
                    },
                    value: {
                        kind: "NumericLiteralExpression",
                        value: 16,
                    },
                    exported: false,
                },
                {
                    kind: "Binding",
                    pattern: {
                        kind: "NamePattern",
                        name: "minDigits",
                    },
                    value: {
                        kind: "NumericLiteralExpression",
                        value: 4,
                    },
                    exported: false,
                },
                {
                    kind: "Binding",
                    pattern: {
                        kind: "NamePattern",
                        name: "maxDigits",
                    },
                    value: {
                        kind: "NumericLiteralExpression",
                        value: 4,
                    },
                    exported: false,
                },
            ],
        },
        "file://V:\\projects\\oss\\pen-monorepo\\packages\\core\\penc\\dist\\deps\\std.pen.js": {
            kind: "Module",
            moduleId: "file://V:\\projects\\oss\\pen-monorepo\\packages\\core\\penc\\dist\\deps\\std.pen.js",
            bindings: [
                {
                    kind: "Binding",
                    pattern: {
                        kind: "NamePattern",
                        name: "char",
                    },
                    value: {
                        kind: "ExtensionExpression",
                        extensionPath: "V:\\projects\\oss\\pen-monorepo\\packages\\core\\penc\\dist\\deps\\std.pen.js",
                        bindingName: "char",
                    },
                    exported: true,
                },
                {
                    kind: "Binding",
                    pattern: {
                        kind: "NamePattern",
                        name: "f64",
                    },
                    value: {
                        kind: "ExtensionExpression",
                        extensionPath: "V:\\projects\\oss\\pen-monorepo\\packages\\core\\penc\\dist\\deps\\std.pen.js",
                        bindingName: "f64",
                    },
                    exported: true,
                },
                {
                    kind: "Binding",
                    pattern: {
                        kind: "NamePattern",
                        name: "i32",
                    },
                    value: {
                        kind: "ExtensionExpression",
                        extensionPath: "V:\\projects\\oss\\pen-monorepo\\packages\\core\\penc\\dist\\deps\\std.pen.js",
                        bindingName: "i32",
                    },
                    exported: true,
                },
                {
                    kind: "Binding",
                    pattern: {
                        kind: "NamePattern",
                        name: "memoise",
                    },
                    value: {
                        kind: "ExtensionExpression",
                        extensionPath: "V:\\projects\\oss\\pen-monorepo\\packages\\core\\penc\\dist\\deps\\std.pen.js",
                        bindingName: "memoise",
                    },
                    exported: true,
                },
            ],
        },
        "file://V:\\projects\\oss\\pen-monorepo\\packages\\core\\penc\\dist\\deps\\experiments.pen.js": {
            kind: "Module",
            moduleId: "file://V:\\projects\\oss\\pen-monorepo\\packages\\core\\penc\\dist\\deps\\experiments.pen.js",
            bindings: [
                {
                    kind: "Binding",
                    pattern: {
                        kind: "NamePattern",
                        name: "unicode",
                    },
                    value: {
                        kind: "ExtensionExpression",
                        extensionPath: "V:\\projects\\oss\\pen-monorepo\\packages\\core\\penc\\dist\\deps\\experiments.pen.js",
                        bindingName: "unicode",
                    },
                    exported: true,
                },
            ],
        },
    },
    startModuleId: "file://V:\\projects\\oss\\pen-monorepo\\packages\\test-suite\\fixtures\\pen-src\\json.pen",
}