# Setup

```sh
npm install babel-plugin-tcomb
```

Webpack config

```js
module: {
  loaders: [
    {
      test: /\.jsx?$/,
      loaders: [
        'babel',
        'babel?plugins=babel-plugin-tcomb&whitelist=' // <= run just the plugin
      ]
    }
  ]
}
```

```js
import t from 'tcomb';

function f(x: t.String) {
  return x;
}

f(1); // => throws [tcomb] Invalid value 1 supplied to String
```

# Roadmap

- Handle arrow functions