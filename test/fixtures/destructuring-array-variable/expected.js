const [a] = _assert(bar, _t.tuple([_t.String]), "destructuring value");
const [b] = _assert(bar, _t.list(_t.String), "destructuring value");
const [c] = [];
