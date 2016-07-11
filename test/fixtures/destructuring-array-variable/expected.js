let [a] = _assert(bar, _t.tuple([_t.String]), 'destructuring value');
let [b] = _assert(bar, _t.list(_t.String), 'destructuring value');
const [c] = [];

a = _assert('test', _t.String, 'a');
b = _assert('test', _t.String, 'b');
