import t from 'tcomb';
function foo(x: { [key: t.String]: t.Number }) {
  _assert(x, t.dict(t.String, t.Number), 'x');

  return x;
}
