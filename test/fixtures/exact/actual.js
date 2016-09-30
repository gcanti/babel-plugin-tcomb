type A = $Exact<{ x: string }>;
type B = {| x: string |};
function f(x: $Exact<{ x: string }>) {}
function g(): $Exact<{ x: string }> {}
function h(x: {| x: string |}) {}
function i(): {| x: string |} {}
