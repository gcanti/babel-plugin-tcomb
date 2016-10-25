function dump({
  obj,
  dumper = obj => {
    const ret = function (obj) {
      return "object: " + obj;
    }.call(this, obj);

    _assert(ret, _t.String, "return value");

    return ret;
  }
}) {
  const ret = function ({
    obj,
    dumper
  }) {
    return dumper(obj);
  }.call(this, {
    obj,
    dumper
  });

  _assert(ret, _t.String, "return value");

  return ret;
}
