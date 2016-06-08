import t from "tcomb";

const A = t.intersection([t.Any, t.Any], "A");
const B = t.Any;