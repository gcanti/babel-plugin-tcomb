import t from 'tcomb';

function foo(x, y) {
  _assert(x, t.Number, "x");

  _assert(y, t.String, "y");

  return x + y;
}
