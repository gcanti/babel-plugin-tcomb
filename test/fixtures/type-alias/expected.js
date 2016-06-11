import _t from 'tcomb';

const T1 = _t.interface({
  name: _t.String
}, 'T1');

const T2 = _t.Number;

const T3 = _t.union([_t.Number, T1], 'T3');

const T4 = _t.list(_t.String, 'T4');

const T5 = _t.Function;

const T6 = _t.maybe(_t.String, 'T6');

const T7 = _t.tuple([_t.String, _t.Number], 'T7');

const T8 = _t.dict(_t.String, _t.Number, 'T8');

const T9 = _t.intersection([_t.String, _t.Number], 'T9');

const T10 = _t.enums.of(['a', 'b'], 'T10');

const T11 = _t.union([_t.enums.of(['a']), _t.Number], 'T11');

const T12 = _t.union([_t.refinement(_t.Number, function (n) {
  return n === 1;
}), _t.refinement(_t.Number, function (n) {
  return n === 2;
})], 'T12');

const T13 = _t.refinement(_t.Number, isPositive, 'T13');

const T14 = _t.refinement(_t.Number, Integer.is, 'T14');
