import _t from "tcomb";

const T1 = _t.list(_t.Any, "T1");

const T2 = Promise;

const T3 = _t.union([_t.Any, _t.enums.of(["a"])], "T3");