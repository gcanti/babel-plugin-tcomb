import t from "tcomb";

function foo(x: number, ...rest: Array<string>) {
  _assert(x, t.Number, "x");

  _assert(rest, t.list(t.String), "rest");
}

function bar(x: number, ...rest?: Array<string>) {
  _assert(x, t.Number, "x");

  _assert(rest, t.maybe(t.list(t.String)), "rest");
}

function baz(x: number, ...rest?: Array<string>): string {
  _assert(x, t.Number, "x");

  _assert(rest, t.maybe(t.list(t.String)), "rest");

  const ret = function (x, ...rest) {}.call(this, x, ...rest);

  _assert(ret, t.String, "return value");

  return ret;
}
