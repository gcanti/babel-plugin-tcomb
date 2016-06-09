import t from "tcomb";

function foo(x) {
  _assert(x, typeof T !== "undefined" ? T : t.Any, "x");
}
