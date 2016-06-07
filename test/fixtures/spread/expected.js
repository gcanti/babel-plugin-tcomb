import t from "tcomb";

function foo(x: number, ...rest: Array<string>) {
  _assert(x, t.Number, "x");

  _assert(rest, t.list(t.String), "rest");
}

function bar(x: number, ...rest?: Array<string>) {
  _assert(x, t.Number, "x");

  _assert(rest, t.maybe(t.list(t.String)), "rest");
}