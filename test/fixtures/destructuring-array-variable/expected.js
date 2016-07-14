let [a] = _assert(bar, _t.tuple([_t.String]), "[a]");
let [b] = _assert(bar, _t.list(_t.String), "[b]");
const [c] = [];

a = _assert(bar, _t.String, "a");
b = _assert(bar, _t.String, "b");
