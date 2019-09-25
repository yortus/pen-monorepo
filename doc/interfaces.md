



```ts

const NO_NODE = Symbol('NoNode'); // void-like

type Parser =   (src: string,   pos: number, result: {ast: unknown, posᐟ: number}) => boolean;

type Unparser = (ast: unknown,  pos: number, result: {src: string,  posᐟ: number}) => boolean;


```
