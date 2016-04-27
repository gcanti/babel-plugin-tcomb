import t from 'tcomb';
function foo(x = 'foo' : t.String) : t.String {
  return x;
}
