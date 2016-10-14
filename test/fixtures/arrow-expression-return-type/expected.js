var _this = this;

import t from "tcomb";
const f = x => {
  _assert(x, t.String, "x");

  const ret = function (x) {
    return x;
  }.call(_this, x);

  _assert(ret, t.String, "return value");

  return ret;
};
