Babel plugin for static and runtime type checking using Flow and tcomb.

**Tools**

[Flow](https://flowtype.org/) is a static type checker for JavaScript.

[tcomb](https://github.com/gcanti/tcomb) is a library for Node.js and the browser which allows you to check the types of JavaScript values at runtime with a simple and concise syntax. It's great for Domain Driven Design and for adding safety to your internal code.

# Why?

**Runtime type checking (tcomb)**

- you don't want or you can't use `Flow`
- you want refinement types
- you want to validate the IO boundary (for example API payloads)
- you want to enforce immutability
- you want to leverage the runtime type introspection provided by `tcomb`'s types

**Static type checking (Flow)**

`babel-plugin-tcomb` is `Flow` compatible, this means that you can run them side by side, statically checking your code with `Flow` and let `tcomb` catching the remaining bugs at runtime.

# Gentle migration path

You can add type safety to your untyped codebase gradually:

- first, add type annotations where you think they are most useful, file by file, leveraging the runtime type safety provided by `tcomb`
- then, when you feel comfortable, turn on `Flow` and unleash the power of static type checking
- third, for even more type safety, define your refinement types and validate the IO boundary

# Setup

First, install via npm.

```sh
npm install --save tcomb
npm install --save-dev gcanti/babel-plugin-tcomb#master # until v0.3 will be released
```

Then, in your babel configuration (usually in your `.babelrc` file), add (at least) the following plugins:

```js
{
  "plugins" : [
    "syntax-flow",
    "tcomb",
    "transform-flow-strip-types"
  ]
}
```

**Important**. `tcomb` must be `require`able

# How it works

First, add type annotations.

```js
// index.js

function sum(a: number, b: number) {
  return a + b
}

sum(1, 'a') // <= typo
```

Then run `Flow` (static type checking):

```
index.js:7
  7: sum(1, 'a')
     ^^^^^^^^^^^ function call
  7: sum(1, 'a')
            ^^^ string. This type is incompatible with
  3: function sum(a: number, b: number) {
                                ^^^^^^ number
```

or refresh your browser and look at the console (runtime type checking):

```
Uncaught TypeError: [tcomb] Invalid value "a" supplied to b: Number
```

## Domain models

```js
// index.js

type Person = {
  name: string, // required string
  surname?: string, // optional string
  age: number,
  tags: Array<string>
};

function getFullName(person: Person) {
  return `${person.name} ${person.surname}`
}

getFullName({ surname: 'Canti' })
```

`Flow`:

```
index.js:14
 14: getFullName({
     ^ function call
 10: function getFullName(person: Person) {
                                  ^^^^^^ property `name`. Property not found in
 14: getFullName({
                 ^ object literal
```

`tcomb`:

```
TypeError: [tcomb] Invalid value undefined supplied to person: Person/name: String
```

## Refinements

In order to define [refinement types](https://github.com/gcanti/tcomb/blob/master/docs/API.md#the-refinement-combinator) you can use the `$Refinement` type, providing a predicate identifier:

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

## Runtime type introspection

Check out the [meta object](https://github.com/gcanti/tcomb/blob/master/docs/API.md#the-meta-object) in the tcomb documentation.

```js
import type { $Reify } from 'tcomb'

type Person = { name: string };

const ReifiedPerson = (({}: any): $Reify<Person>)
console.log(ReifiedPerson.meta) // => { kind: 'interface', props: ... }
```

## Validating (at runtime) the IO boundary using typecasts

```js
type User = { name: string };

export function loadUser(userId: string): Promise<User> {
  return axios.get('...').then(p => (p: User)) // <= type cast
}
```

## Recursive types

Just add a `// recursive` comment on top:

```js
// recursive
type Path = {
  node: Node,
  parentPath: Path
};
```

# Type-checking Redux

```js
import { createStore } from 'redux'

// types
type State = number;
type ReduxInitAction = { type: '@@redux/INIT' };
type Action = ReduxInitAction
  | { type: 'INCREMENT', delta: number }
  | { type: 'DECREMENT', delta: number };

function reducer(state: State = 0, action: Action): State {
  switch(action.type) {
    case 'INCREMENT' :
      return state + action.delta
    case 'DECREMENT' :
      return state - action.delta
  }
  return state
}

type Store = {
  dispatch: (action: Action) => any;
};

const store: Store = createStore(reducer)

store.dispatch({ type: 'INCREMEN', delta: 1 }) // <= typo

// throws [tcomb] Invalid value { "type": "INCREMEN", "delta": 1 } supplied to action: Action
// Flow throws as well
```

# Type-checking React

Using [tcomb-react](https://github.com/gcanti/tcomb-react):

```js
// @flow

import React from 'react'
import ReactDOM from 'react-dom'
import { props } from 'tcomb-react'

type Props = {
  name: string
};

@props(Props)
class Hello extends React.Component<void, Props, void> {
  render() {
    return <div>Hello {this.props.name}</div>
  }
}


ReactDOM.render(<Hello />, document.getElementById('app'))
```

`Flow` will throw:

```
index.js:12
 12: class Hello extends React.Component<void, Props, void> {
                                               ^^^^^ property `name`. Property not found in
 19: ReactDOM.render(<Hello />, document.getElementById('app'))
                     ^^^^^^^^^ props of React element `Hello`
```

while `tcomb-react` will warn:

```
Warning: Failed propType: [tcomb] Invalid prop "name" supplied to Hello, should be a String.

Detected errors (1):

  1. Invalid value undefined supplied to String
```

Additional babel configuration:

```js
{
  "presets": ["es2015", "react"],
  "plugins" : [
    "tcomb",
    "transform-decorators-legacy"
  ]
}
```

### Without decorators

```js
// @flow

import React from 'react'
import ReactDOM from 'react-dom'
import { propTypes } from 'tcomb-react'
import type { $Reify } from 'tcomb'

type Props = {
  name: string
};

class Hello extends React.Component<void, Props, void> {
  render() {
    return <div>Hello {this.props.name}</div>
  }
}

Hello.propTypes = propTypes((({}: any): $Reify<Props>))

ReactDOM.render(<Hello />, document.getElementById('app'))
```

# Definition files

Definition files for `tcomb` and `tcomb-react` are temporarily published [here](https://github.com/gcanti/pantarei).

# Caveats

- `tcomb` must be `require`able
- type parameters (aka generics) are not handled (`Flow`'s responsability)

# Plugin config

- `skipAsserts: boolean = false` removes the asserts and keeps the domain models