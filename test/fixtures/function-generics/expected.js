import t from "tcomb";

function foo(x) {
  _assert(x, t.Any, "x");
}
