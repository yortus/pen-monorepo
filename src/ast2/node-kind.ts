export const NodeKinds = {
    Application:        {isExpression: true},
    Block:              {isExpression: true},
    CharacterRange:     {isExpression: true},
    Definition:         {},
    Function:           {isExpression: true},
    ImportNames:        {},
    ImportNamespace:    {},
    ListLiteral:        {isExpression: true},
    ModuleDefinition:   {},
    Parenthetical:      {isExpression: true},
    RecordField:        {},
    RecordLiteral:      {isExpression: true},
    Reference:          {isExpression: true},
    Selection:          {isExpression: true},
    Sequence:           {isExpression: true},
    StringLiteral:      {isExpression: true},
    VoidLiteral:        {isExpression: true},
} as const;


export type NodeKind = keyof typeof NodeKinds;


export type ExpressionNodeKind
    = {[K in NodeKind]: (typeof NodeKinds)[K] extends {isExpression: true} ? K : never}[NodeKind];
