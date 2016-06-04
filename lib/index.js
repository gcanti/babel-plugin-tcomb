'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

exports.default = function (_ref) {
  var t = _ref.types;
  var template = _ref.template;


  var tcombExpression = null;
  var assertHelperName = null;

  function getExpression(node) {
    return t.isExpressionStatement(node) ? node.expression : node;
  }

  function expression(input) {
    var fn = template(input);
    return function (args) {
      var node = fn(args);
      return getExpression(node);
    };
  }

  var assertHelper = expression('\n    function assert(x, type, name) {\n      if (tcomb.isType(type)) {\n        type(x, [name + \': \' + tcomb.getTypeName(type)]);\n        if (type.meta.kind !== \'struct\') {\n          return;\n        }\n      }\n      if (!(x instanceof type)) {\n        tcomb.fail(\'Invalid value \' + tcomb.stringify(x) + \' supplied to \' + name + \' (expected a \' + tcomb.getTypeName(type) + \')\');\n      }\n    }\n  ');

  function ensureTcombExpression() {
    if (!tcombExpression) {
      tcombExpression = t.callExpression(t.identifier('require'), [t.StringLiteral('tcomb')]);
    }
  }

  function getTcombExpressionFromImports(node) {
    for (var i = 0, len = node.specifiers.length; i < len; i++) {
      var specifier = node.specifiers[i];
      var found = specifier.type === 'ImportSpecifier' && specifier.imported.name === 't' || specifier.type === 'ImportDefaultSpecifier';
      if (found) {
        return t.identifier(specifier.local.name);
      }
    }
  }

  function isObjectPattern(node) {
    return node.type === 'ObjectPattern';
  }

  function getTcombExpressionFromRequires(node) {
    var importName = node.init.arguments[0].value;

    if (importName === 'tcomb') {
      return t.identifier(node.id.name);
    }
    if (isObjectPattern(node.id)) {
      for (var i = 0, len = node.id.properties.length; i < len; i++) {
        var property = node.id.properties[i];
        if (property.key.name === 't') {
          return t.identifier(property.key.name);
        }
      }
    }
    return t.identifier(node.id.name + '.t');
  }

  function getExpressionFromGenericTypeAnnotation(id) {
    if (id.type === 'QualifiedTypeIdentifier') {
      return t.memberExpression(getExpressionFromGenericTypeAnnotation(id.qualification), t.identifier(id.id.name));
    }
    return t.identifier(id.name);
  }

  function addTypeName(args, name) {
    if ((typeof name === 'undefined' ? 'undefined' : _typeof(name)) === 'object') {
      args.push(name);
    }
    return args;
  }

  function getListCombinator(type, name) {
    return t.callExpression(t.memberExpression(tcombExpression, t.identifier('list')), addTypeName([type], name));
  }

  function getMaybeCombinator(type, name) {
    return t.callExpression(t.memberExpression(tcombExpression, t.identifier('maybe')), addTypeName([type], name));
  }

  function getTupleCombinator(types, name) {
    return t.callExpression(t.memberExpression(tcombExpression, t.identifier('tuple')), addTypeName([t.arrayExpression(types)], name));
  }

  function getUnionCombinator(types, name) {
    return t.callExpression(t.memberExpression(tcombExpression, t.identifier('union')), addTypeName([t.arrayExpression(types)], name));
  }

  function getEnumsCombinator(enums, name) {
    return t.callExpression(t.memberExpression(t.memberExpression(tcombExpression, t.identifier('enums')), t.identifier('of')), addTypeName([t.arrayExpression(enums.map(function (e) {
      return t.stringLiteral(e);
    }))], name));
  }

  function getDictCombinator(domain, codomain, name) {
    return t.callExpression(t.memberExpression(tcombExpression, t.identifier('dict')), addTypeName([domain, codomain], name));
  }

  function getIntersectionCombinator(types, name) {
    return t.callExpression(t.memberExpression(tcombExpression, t.identifier('intersection')), addTypeName([t.arrayExpression(types)], name));
  }

  function getFuncCombinator(domain, codomain, name) {
    return t.callExpression(t.memberExpression(tcombExpression, t.identifier('func')), addTypeName([t.arrayExpression(domain), codomain], name));
  }

  function getObjectExpression(properties) {
    var props = properties.map(function (prop) {
      var name = t.identifier(prop.key.name);
      var type = getType(prop.value);
      if (prop.optional) {
        type = getMaybeCombinator(type);
      }
      return t.objectProperty(name, type);
    });
    return t.objectExpression(props);
  }

  function getInterfaceCombinator(annotation, name) {
    return t.callExpression(t.memberExpression(tcombExpression, t.identifier(INTERFACE_NAME)), addTypeName([getObjectExpression(annotation.properties)], name));
  }

  //
  // Flow types
  //

  function getNumberType() {
    return t.memberExpression(tcombExpression, t.identifier('Number'));
  }

  function getStringType() {
    return t.memberExpression(tcombExpression, t.identifier('String'));
  }

  function getBooleanType() {
    return t.memberExpression(tcombExpression, t.identifier('Boolean'));
  }

  function getVoidType() {
    return t.memberExpression(tcombExpression, t.identifier('Nil'));
  }

  function getNullType() {
    return t.memberExpression(tcombExpression, t.identifier('Nil'));
  }

  function getAnyType() {
    return t.memberExpression(tcombExpression, t.identifier('Any'));
  }

  function getNumericLiteralType(value) {
    var n = t.identifier('n');
    return t.callExpression(t.memberExpression(tcombExpression, t.identifier('refinement')), [getNumberType(), t.functionExpression(null, [n], t.blockStatement([t.returnStatement(t.binaryExpression('===', n, t.numericLiteral(value)))]))]);
  }

  function getType(annotation, name) {
    switch (annotation.type) {

      case 'GenericTypeAnnotation':
        if (annotation.id.name === 'Array') {
          if (!annotation.typeParameters || annotation.typeParameters.params.length !== 1) {
            // TODO(giu) what's this?
            throw new SyntaxError('Unsupported Array type annotation');
          }
          return getListCombinator(getType(annotation.typeParameters.params[0]), name);
        }
        return getExpressionFromGenericTypeAnnotation(annotation.id);

      case 'ArrayTypeAnnotation':
        return getListCombinator(getType(annotation.elementType), name);

      case 'NullableTypeAnnotation':
        return getMaybeCombinator(getType(annotation.typeAnnotation), name);

      case 'TupleTypeAnnotation':
        return getTupleCombinator(annotation.types.map(getType), name);

      case 'UnionTypeAnnotation':
        // handle enums
        if (annotation.types.every(function (n) {
          return n.type === 'StringLiteralTypeAnnotation';
        })) {
          return getEnumsCombinator(annotation.types.map(function (n) {
            return n.value;
          }), name);
        }
        return getUnionCombinator(annotation.types.map(getType), name);

      case 'ObjectTypeAnnotation':
        if (annotation.indexers.length === 1) {
          return getDictCombinator(getType(annotation.indexers[0].key), getType(annotation.indexers[0].value), name);
        }
        return getInterfaceCombinator(annotation, name);

      case 'IntersectionTypeAnnotation':
        return getIntersectionCombinator(annotation.types.map(getType), name);

      case 'FunctionTypeAnnotation':
        return getFuncCombinator(annotation.params.map(function (param) {
          return getType(param.typeAnnotation);
        }), getType(annotation.returnType), name);

      case 'NumberTypeAnnotation':
        return getNumberType();

      case 'StringTypeAnnotation':
        return getStringType();

      case 'BooleanTypeAnnotation':
        return getBooleanType();

      case 'VoidTypeAnnotation':
        return getVoidType();

      case 'NullLiteralTypeAnnotation':
        return getNullType();

      case 'AnyTypeAnnotation':
      case 'MixedTypeAnnotation':
        return getAnyType();

      case 'StringLiteralTypeAnnotation':
        return getEnumsCombinator([annotation.value], name);

      case 'NumericLiteralTypeAnnotation':
        return getNumericLiteralType(annotation.value, name);

      default:
        throw new SyntaxError('Unsupported type annotation: ' + annotation.type);
    }
  }

  function getAssert(_ref2) {
    var id = _ref2.id;
    var optional = _ref2.optional;
    var typeAnnotation = _ref2.typeAnnotation;
    var name = _ref2.name;

    var type = getType(typeAnnotation);
    if (optional) {
      type = getMaybeCombinator(type);
    }
    name = name || t.stringLiteral(id.name);
    return t.expressionStatement(t.callExpression(assertHelperName, [id, type, name]));
  }

  function getFunctionArgumentCheckExpressions(node) {
    var params = [];

    node.params.forEach(function (param, i) {
      if (param.type === 'AssignmentPattern') {
        if (param.left.typeAnnotation) {
          params.push({
            id: t.identifier(param.left.name),
            optional: param.optional,
            typeAnnotation: param.left.typeAnnotation.typeAnnotation
          });
        } else if (param.typeAnnotation) {
          params.push({
            id: t.identifier(param.left.name),
            optional: param.optional,
            typeAnnotation: param.typeAnnotation.typeAnnotation
          });
        }
      } else if (param.typeAnnotation) {
        params.push({
          id: t.identifier(isObjectPattern(param) ? 'arguments[' + i + ']' : param.name),
          optional: param.optional,
          typeAnnotation: param.typeAnnotation.typeAnnotation
        });
      }
    });

    if (params.length > 0) {
      ensureTcombExpression();
    }

    return params.map(getAssert);
  }

  function getWrappedFunctionReturnWithTypeCheck(node) {
    var params = node.params.map(function (param) {
      if (isObjectPattern(param)) {
        return param;
      } else if (param.type === 'AssignmentPattern') {
        return param.left;
      }
      return t.identifier(param.name);
    });
    var callParams = params.map(function (param) {
      if (isObjectPattern(param)) {
        return t.objectExpression(param.properties);
      }
      return param;
    });

    var id = t.identifier('ret');

    var assert = getAssert({
      id: id,
      typeAnnotation: node.returnType.typeAnnotation,
      name: t.stringLiteral('return value')
    });

    return [t.variableDeclaration('const', [t.variableDeclarator(id, t.callExpression(t.memberExpression(t.functionExpression(null, params, node.body), t.identifier('call')), [t.identifier('this')].concat(callParams)))]), assert, t.returnStatement(id)];
  }

  function getTypeAliasDefinition(node) {
    return t.variableDeclaration('const', [t.variableDeclarator(node.id, getType(node.right, t.stringLiteral(node.id.name)))]);
  }

  function getInterfaceDefinition(node) {
    var name = t.stringLiteral(node.id.name);
    if (node.extends.length === 0) {
      return t.variableDeclaration('const', [t.variableDeclarator(node.id, getType(node.body, name))]);
    } else {
      // handle extends
      return t.variableDeclaration('const', [t.variableDeclarator(node.id, t.callExpression(t.memberExpression(t.memberExpression(tcombExpression, t.identifier(INTERFACE_NAME)), t.identifier('extend')), [t.arrayExpression(node.extends.map(function (inter) {
        return inter.id;
      }).concat(getObjectExpression(node.body.properties))), name]))]);
    }
  }

  //
  // visitors
  //

  return {
    visitor: {
      Program: {
        enter: function enter(path) {
          // Ensure we reset the import between each file so that our guard
          // of the import works correctly.
          tcombExpression = null;
          assertHelperName = path.scope.generateUidIdentifier('assert');
        },
        exit: function exit(path, state) {
          if (state.opts['skipHelpers'] || state.opts['skipAsserts']) {
            return;
          }
          ensureTcombExpression();
          path.node.body.unshift(assertHelper({
            assert: assertHelperName,
            tcomb: tcombExpression
          }));
        }
      },

      ImportDeclaration: function ImportDeclaration(path) {
        var node = path.node;

        if (!tcombExpression && tcombLibraries.hasOwnProperty(node.source.value)) {
          tcombExpression = getTcombExpressionFromImports(node);
        }
        if (node.importKind === 'type') {
          path.replaceWith(t.importDeclaration(node.specifiers, node.source));
        }
      },
      VariableDeclarator: function VariableDeclarator(_ref3) {
        var node = _ref3.node;

        if (node.init && node.init.type && node.init.type === 'CallExpression' && node.init.callee.name === 'require' && node.init.arguments && node.init.arguments.length > 0 && node.init.arguments[0].type === 'StringLiteral' && tcombLibraries.hasOwnProperty(node.init.arguments[0].value)) {
          tcombExpression = getTcombExpressionFromRequires(node);
        }
      },
      TypeAlias: function TypeAlias(path) {
        ensureTcombExpression();
        path.replaceWith(getTypeAliasDefinition(path.node));
      },
      InterfaceDeclaration: function InterfaceDeclaration(path) {
        ensureTcombExpression();
        path.replaceWith(getInterfaceDefinition(path.node));
      },
      Function: function Function(path, state) {
        if (state.opts['skipAsserts']) {
          return;
        }

        var node = path.node;


        try {
          // Firstly let's replace arrow function expressions into
          // block statement return structures.
          if (node.type === "ArrowFunctionExpression" && node.expression) {
            node.expression = false;
            node.body = t.blockStatement([t.returnStatement(node.body)]);
          }

          // If we have a return type then we will wrap our entire function
          // body and insert a type check on the returned value.
          if (node.returnType) {
            ensureTcombExpression();

            var funcBody = path.get('body');

            funcBody.replaceWithMultiple(getWrappedFunctionReturnWithTypeCheck(node));
          }

          // Prepend any argument checks to the top of our function body.
          var argumentChecks = getFunctionArgumentCheckExpressions(node);
          if (argumentChecks.length > 0) {
            var _node$body$body;

            (_node$body$body = node.body.body).unshift.apply(_node$body$body, _toConsumableArray(argumentChecks));
          }
        } catch (e) {
          if (e instanceof SyntaxError) {
            throw new Error('[babel-plugin-tcomb] ' + e.message);
          } else {
            throw e;
          }
        }
      }
    }
  };
};

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var tcombLibraries = {
  'tcomb': 1,
  'tcomb-validation': 1,
  'tcomb-react': 1,
  'tcomb-form': 1,
  'redux-tcomb': 1
};

var INTERFACE_NAME = 'interface';