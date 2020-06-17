export function nextNodeId() {
    return ++counter;
}


export function resetNodeId() {
    counter = -1;
}


let counter = -1;
