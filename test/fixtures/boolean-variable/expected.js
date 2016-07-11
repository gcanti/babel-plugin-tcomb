const foo = x;

_assert(foo, _t.Boolean, "foo");

let bar = foo;

_assert(bar, _t.Boolean, "bar");

bar = true;

_assert(bar, _t.Boolean, "bar");

let foobar;

foobar = false;

_assert(foobar, _t.Boolean, "foobar");
