const f = x => {
  x = t.String(x);

  const ret = function (x) {
    return x;
  }(x);

  return t.String(ret);
};