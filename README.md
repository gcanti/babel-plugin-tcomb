[tcomb](https://github.com/gcanti/tcomb) is a library for Node.js and the browser which allows you to check the types of JavaScript values at runtime with a simple and concise syntax. It's great for Domain Driven Design and for adding safety to your internal code.

# Why?

- you don't want or you can't use `Flow`
- you want refinement types
- you want to validate the IO boundary (for example API payloads)
- you want to enforce immutability
- you want to leverage the runtime type introspection provided by `tcomb`'s types

# `Flow` compatible

`babel-plugin-tcomb` **is `Flow` compatible**, this means that you can run them side by side, statically checking your code with `Flow` and let `tcomb` catching the remaining bugs at runtime.

# How it works

```js
function sum(a: number, b: number): number {
  return a + b
}
```

compiles to:

```js
// _assert is an helper added by babel-plugin-tcomb
function sum(a, b) {
  _assert(a, require('tcomb').Number, 'a') // <= runtime type checking by tcomb
  _assert(b, require('tcomb').Number, 'b')

  const ret = function (a, b) {
    return a + b
  }.call(this, a, b)

  _assert(ret, require('tcomb').Number, 'return value')

  return ret
}
```

# Defining refinements (*)

In order to define refinement types you can use the `$Refinement` type providing a predicate:

```js
import type { $Refinement } from 'tcomb'

// define you predicate...
const isInteger = n => n % 2 === 0

// ...and pass it to the suitable intersection type involving the $Refinement type
type Integer = number & $Refinement<typeof isInteger>;

function foo(n: Integer) {
  return n
}

foo(2)   // flow ok, tcomb ok
foo(2.1) // flow ok, tcomb throws [tcomb] Invalid value 2.1 supplied to n: Integer
foo('a') // flow throws, tcomb throws
```

# Runtime type introspection (*)

```js
import type { $Reify } from 'tcomb'

type Person = { name: string };

const ReifiedPerson = (({}: any): $Reify<Person>)
console.log(ReifiedPerson.meta) // => { kind: 'interface', props: ... }
```

> (*) these are considered (inevitable and useful) hacks

# Validating (at runtime) the IO boundary using typecasts

```js
type User = { name: string };

export function loadUser(userId: string): Promise<User> {
  return axios.get('...').then(p => (p: User)) // <= type cast
}
```

# Caveats

- `tcomb` must be `require`able
- generics are not handled (`Flow`'s responsability)

# Setup

First, install via npm.

```sh
npm install --save-dev babel-plugin-tcomb
```

Then, in your babel configuration (usually in your `.babelrc` file), add (at least) the following plugins:

{
  "plugins" : ["syntax-flow", "tcomb", "transform-flow-strip-types"]
}

# Plugin config

- `skipAsserts` removes the asserts but keeps the models