const foo = _assert(x, _t.Boolean, "foo");
let bar = _assert(foo, _t.Boolean, "bar");

bar = _assert(x, _t.Boolean, "bar");

let foobar;

foobar = _assert(x, _t.Boolean, "foobar");
