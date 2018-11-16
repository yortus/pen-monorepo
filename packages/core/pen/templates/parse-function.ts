export function parse(text: string) {
    let pos = 0;
    let ret: any;
    const NOTHING = Symbol('nothing');
    type Combinator = () => boolean;




    placeholder: {}




    // TODO: temp testing eg...
    // Expr = Add | Sub | Term
    // Add = {type: 'add', lhs: Memo<Expr>, rhs: ADD Term}
    // Sub = {type: 'sub', lhs: Memo<Expr>, rhs: SUB Term}

    const _Start = lazy(() => _Expr);

    const _Expr = lazy(() => leftRec(selection([_Add, _Sub, _Term])));

    const _Add = lazy(() => record({
        'type': stringLiteral('add', 'ast'),
        'lhs': _Expr,
        'rhs': sequence([_ADD, _Term]),
    }));

    const _Sub = lazy(() => record({
        'type': stringLiteral('sub', 'ast'),
        'lhs': _Expr,
        'rhs': sequence([_SUB, _Term]),
    }));

    const _Term = () => false;
    const _ADD = () => false;
    const _SUB = () => false;


    function leftRec(expr: Combinator): Combinator {
        // TODO: ...
        // check for memoised result:
        // 1. if no memo:
        //   1.1. set memo to 'evaluating' sentinel value
        //   1.2. attempt to evaluate (recursive step)
        //   1.3. set memo to result
        //   1.4. TODO: loop until result is not longer...
        // 2. if 'evaluating' sentinel found:
        //   2.1. return false / parse failure
        // 3. if result found:
        //   3.1. return result
        interface Memo {
            state: 'resolving' | 'resolvingCyclic' | 'resolved';
        }
        const memos = new Map<number, Memo>();
        return () => {
            //
        };
    }

    function lazy(init: () => Combinator): Combinator {
        let defn: Combinator | undefined;
        return () => (defn || (defn = init()))();
    }

    function selection(expressions: Combinator[]): Combinator {
        return () => {
            for (let expr of expressions) {
                if (expr()) return true;
            }
            return false;
        };
    }

    function sequence(expressions: Combinator[]): Combinator {
        return () => {
            let oldPos = pos;
            for (let expr of expressions) {
                if (expr()) continue;
                pos = oldPos;
                return false;
            }
            return true;
        };
    }

    function record(fields: {[id: string]: Combinator}): Combinator {
        // TODO: doc... relies on prop order being preserved...
        return () => {
            let oldPos = pos;
            let obj = {};
            for (let id in fields) {
                if (!fields.hasOwnProperty(id)) continue;
                let value = fields[id];
                if (!value()) {
                    pos = oldPos;
                    return false;
                }
                obj[id] = ret;
            }
            ret = obj;
            return true;
        };
    }

    function identifier(name: string): Combinator {
        // TODO: ...
        return () => false;
    }

    function stringLiteral(value: string, onlyIn?: 'ast' | 'text'): Combinator {
        const len = value.length;
        return () => {
            if (onlyIn !== 'ast') {
                for (let i = 0; i < len; ++i) {
                    if (text.charCodeAt(pos + i) !== value.charCodeAt(i)) return false;
                }
                pos += value.length;
            }
            ret = onlyIn === 'text' ? NOTHING : value;
            return true;
        };
    }
}
