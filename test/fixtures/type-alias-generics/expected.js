import t from "tcomb";

const T1 = t.list(t.Any, "T1");
const T2 = Promise;
const T3 = t.union([t.Any, t.enums.of(["a"])], "T3");