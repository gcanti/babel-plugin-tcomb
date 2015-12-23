const f = x => {
  t.assert(t.String.is(x));

  const ret = (function (x) {
    return x;
  }).call(this, x);

  t.assert(t.String.is(ret));
  return ret;
};