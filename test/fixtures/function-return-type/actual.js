function foo(x: number, y: string): string {
  return x + y;
}

function bar(x, y: string): string {
  return x + y;
}

function f({x = "ex"}): void {
  console.log({x});
}
