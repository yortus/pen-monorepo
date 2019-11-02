export const NodeKinds = [
    'Application',
    'Block',
    'CharacterRange',
    'Definition',
    'Function',
    'ImportNames',
    'ImportNamespace',
    'ListLiteral',
    'ModuleDefinition',
    'Parenthetical',
    'RecordField',
    'RecordLiteral',
    'Reference',
    'Selection',
    'Sequence',
    'StringLiteral',
    'VoidLiteral',
] as const;


export type NodeKind = (typeof NodeKinds)[any];
