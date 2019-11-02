export const NodeVersions = [
    100,
    200,
    300,
] as const;


export type NodeVersion = (typeof NodeVersions)[any];
