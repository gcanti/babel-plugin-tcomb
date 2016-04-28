import t from 'tcomb';
function foo(x: t.Number, y = 1: t.Number) {
  return x + y;
}

function bar(x: t.Number, y: t.Number = 1) {
  return x + y;
}
