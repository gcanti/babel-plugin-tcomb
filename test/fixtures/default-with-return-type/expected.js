import t from 'tcomb';

function foo(x = 'foo') {
  _assert(x, t.String, "x");

  const ret = function (x) {
    return x;
  }.call(this, x);

  _assert(ret, t.String, "return value");

  return ret;
}
