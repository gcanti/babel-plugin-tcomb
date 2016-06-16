'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _RESERVED_NAMES;

exports.default = function (_ref) {
  var t = _ref.types;
  var template = _ref.template;


  var tcombId = null;
  var assertId = null;
  var extendId = null;
  var hasTypes = false;
  var hasAsserts = false;
  var hasExtend = false;

  var assertTemplate = expression('\n    function assertId(x, type, name) {\n      if (tcombId.isType(type) && type.meta.kind !== \'struct\') {\n        type(x, [name + \': \' + tcombId.getTypeName(type)]);\n      } else if (!(x instanceof type)) {\n        tcombId.fail(\'Invalid value \' + tcombId.stringify(x) + \' supplied to \' + name + \' (expected a \' + tcombId.getTypeName(type) + \')\');\n      }\n      return x;\n    }\n  ');

  var ensureTypeTemplate = expression('typeof type !== "undefined" ? type : tcombId.Any');

  var extendTemplate = expression('\n    function extendId(types, name) {\n      const isAny = (type) => {\n        if (type === tcombId.Any) {\n          return true;\n        }\n        if (tcombId.isType(type) && type.meta.kind === \'maybe\') {\n          return isAny(type.meta.type)\n        }\n        return false;\n      }\n      return tcombId.interface.extend(types.filter(type => !isAny(type)), name)\n    }\n  ');

  //
  // combinators
  //

  function getListCombinator(type, name) {
    return t.callExpression(t.memberExpression(tcombId, t.identifier('list')), addTypeName([type], name));
  }

  function getMaybeCombinator(type, name) {
    return t.callExpression(t.memberExpression(tcombId, t.identifier('maybe')), addTypeName([type], name));
  }

  function getTupleCombinator(types, name) {
    return t.callExpression(t.memberExpression(tcombId, t.identifier('tuple')), addTypeName([t.arrayExpression(types)], name));
  }

  function getUnionCombinator(types, name) {
    return t.callExpression(t.memberExpression(tcombId, t.identifier('union')), addTypeName([t.arrayExpression(types)], name));
  }

  function getEnumsCombinator(enums, name) {
    return t.callExpression(t.memberExpression(t.memberExpression(tcombId, t.identifier('enums')), t.identifier('of')), addTypeName([t.arrayExpression(enums.map(function (e) {
      return t.stringLiteral(e);
    }))], name));
  }

  function getDictCombinator(domain, codomain, name) {
    return t.callExpression(t.memberExpression(tcombId, t.identifier('dict')), addTypeName([domain, codomain], name));
  }

  function getRefinementCombinator(type, predicate, name) {
    return t.callExpression(t.memberExpression(tcombId, t.identifier('refinement')), addTypeName([type, predicate], name));
  }

  function getIntersectionCombinator(types, name) {
    var intersections = types.filter(function (t) {
      return !t._refinementPredicateId;
    });
    var refinements = types.filter(function (t) {
      return t._refinementPredicateId;
    });
    var intersection = intersections.length > 1 ? t.callExpression(t.memberExpression(tcombId, t.identifier('intersection')), addTypeName([t.arrayExpression(intersections)], name)) : intersections[0];
    var len = refinements.length;
    if (len > 0) {
      for (var i = 0; i < len; i++) {
        intersection = getRefinementCombinator(intersection, refinements[i]._refinementPredicateId, name);
      }
    }
    return intersection;
  }

  function getInterfaceCombinator(props, name) {
    return t.callExpression(t.memberExpression(tcombId, t.identifier(INTERFACE_COMBINATOR_NAME)), addTypeName([props], name));
  }

  function getDeclareCombinator(name) {
    return t.callExpression(t.memberExpression(tcombId, t.identifier('declare')), [name]);
  }

  //
  // Flow types
  //

  function getFunctionType() {
    return t.memberExpression(tcombId, t.identifier('Function'));
  }

  function getObjectType() {
    return t.memberExpression(tcombId, t.identifier('Object'));
  }

  function getNumberType() {
    return t.memberExpression(tcombId, t.identifier('Number'));
  }

  function getStringType() {
    return t.memberExpression(tcombId, t.identifier('String'));
  }

  function getBooleanType() {
    return t.memberExpression(tcombId, t.identifier('Boolean'));
  }

  function getVoidType() {
    return t.memberExpression(tcombId, t.identifier('Nil'));
  }

  function getNullType() {
    return t.memberExpression(tcombId, t.identifier('Nil'));
  }

  function getAnyType() {
    return t.memberExpression(tcombId, t.identifier('Any'));
  }

  function getNumericLiteralType(value) {
    var n = t.identifier('n');
    return t.callExpression(t.memberExpression(tcombId, t.identifier('refinement')), [getNumberType(), t.functionExpression(null, [n], t.blockStatement([t.returnStatement(t.binaryExpression('===', n, t.numericLiteral(value)))]))]);
  }

  //
  // helpers
  //

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

  function addTypeName(args, name) {
    if ((typeof name === 'undefined' ? 'undefined' : _typeof(name)) === 'object') {
      args.push(name);
    }
    return args;
  }

  function getObjectExpression(properties, typeParameters) {
    var props = properties.map(function (prop) {
      var name = t.identifier(prop.key.name);
      var type = getType({ annotation: prop.value, typeParameters: typeParameters });
      if (prop.optional) {
        type = getMaybeCombinator(type);
      }
      return t.objectProperty(name, type);
    });
    return t.objectExpression(props);
  }

  function getExpressionFromGenericTypeAnnotation(id) {
    if (id.type === 'QualifiedTypeIdentifier') {
      return t.memberExpression(getExpressionFromGenericTypeAnnotation(id.qualification), t.identifier(id.id.name));
    }
    return id;
  }

  function getRefinementPredicateId(annotation) {
    if (annotation.typeParameters.params.length !== 1 || !annotation.typeParameters.params[0].argument) {
      throw new Error('Invalid refinement definition, example: Refinement<typeof predicate>');
    }
    return getExpressionFromGenericTypeAnnotation(annotation.typeParameters.params[0].argument.id);
  }

  function isTypeParameter(name, typeParameters) {
    return typeParameters && typeParameters.hasOwnProperty(name);
  }

  function shouldReturnAnyType(typeParameters, name) {
    return isTypeParameter(name, typeParameters) // this plugin doesn't handle generics by design
    // Flow magic types
     || name === '$Shape' || name === '$Keys' || name === '$Diff';
  }

  function getGenericTypeAnnotation(_ref2) {
    var annotation = _ref2.annotation;
    var typeName = _ref2.typeName;
    var typeParameters = _ref2.typeParameters;

    var name = annotation.id.name;
    if (name === 'Array') {
      if (!annotation.typeParameters || annotation.typeParameters.params.length !== 1) {
        throw new Error('Unsupported Array type annotation: incorrect number of type parameters (expected 1)');
      }
      var typeParameter = annotation.typeParameters.params[0];
      return getListCombinator(getType({ annotation: typeParameter, typeParameters: typeParameters }), typeName);
    }
    if (name === 'Function') {
      return getFunctionType();
    }
    if (name === 'Object') {
      return getObjectType();
    }
    if (shouldReturnAnyType(typeParameters, name)) {
      return getAnyType();
    }
    var gta = getExpressionFromGenericTypeAnnotation(annotation.id);
    if (name === MAGIC_REFINEMENT_NAME) {
      gta._refinementPredicateId = getRefinementPredicateId(annotation);
    }
    return gta;
  }

  function getType(_ref3) {
    var annotation = _ref3.annotation;
    var typeName = _ref3.typeName;
    var typeParameters = _ref3.typeParameters;

    switch (annotation.type) {

      case 'GenericTypeAnnotation':
        return getGenericTypeAnnotation({ annotation: annotation, typeName: typeName, typeParameters: typeParameters });

      case 'ArrayTypeAnnotation':
        return getListCombinator(getType({ annotation: annotation.elementType, typeParameters: typeParameters }), typeName);

      case 'NullableTypeAnnotation':
        return getMaybeCombinator(getType({ annotation: annotation.typeAnnotation, typeParameters: typeParameters }), typeName);

      case 'TupleTypeAnnotation':
        return getTupleCombinator(annotation.types.map(function (annotation) {
          return getType({ annotation: annotation, typeParameters: typeParameters });
        }), typeName);

      case 'UnionTypeAnnotation':
        // handle enums
        if (annotation.types.every(function (n) {
          return n.type === 'StringLiteralTypeAnnotation';
        })) {
          return getEnumsCombinator(annotation.types.map(function (n) {
            return n.value;
          }), typeName);
        }
        return getUnionCombinator(annotation.types.map(function (annotation) {
          return getType({ annotation: annotation, typeParameters: typeParameters });
        }), typeName);

      case 'ObjectTypeAnnotation':
        if (annotation.indexers.length === 1) {
          return getDictCombinator(getType({ annotation: annotation.indexers[0].key, typeParameters: typeParameters }), getType({ annotation: annotation.indexers[0].value, typeParameters: typeParameters }), typeName);
        }
        return getInterfaceCombinator(getObjectExpression(annotation.properties, typeParameters), typeName);

      case 'IntersectionTypeAnnotation':
        return getIntersectionCombinator(annotation.types.map(function (annotation) {
          return getType({ annotation: annotation, typeParameters: typeParameters });
        }), typeName);

      case 'FunctionTypeAnnotation':
        return getFunctionType();
      // return getFuncCombinator(annotation.params.map((param) => getType(param.typeAnnotation)), getType(annotation.returnType), typeName)

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
        return getEnumsCombinator([annotation.value], typeName);

      case 'NumericLiteralTypeAnnotation':
        return getNumericLiteralType(annotation.value, typeName);

      default:
        throw new Error('Unsupported type annotation: ' + annotation.type);
    }
  }

  function getAssertArgumentName(id) {
    if (id.type === 'MemberExpression') {
      return getAssertArgumentName(id.object) + '.' + id.property.name;
    }
    return id.name;
  }

  function getAssert(_ref4, typeParameters) {
    var id = _ref4.id;
    var optional = _ref4.optional;
    var annotation = _ref4.annotation;
    var name = _ref4.name;

    var typeAST = getType({ annotation: annotation, typeParameters: typeParameters });
    if (optional) {
      typeAST = getMaybeCombinator(typeAST);
    }
    name = name || t.stringLiteral(getAssertArgumentName(id));
    if (typeAST.type === 'Identifier') {
      typeAST = ensureTypeTemplate({ tcombId: tcombId, type: typeAST });
    }
    return t.expressionStatement(t.callExpression(assertId, [id, typeAST, name]));
  }

  function isObjectPattern(node) {
    return node.type === 'ObjectPattern';
  }

  function getParam(param, i) {
    if (param.type === 'AssignmentPattern' && param.left.typeAnnotation) {
      return getParam(param.left, i);
    } else if (param.typeAnnotation) {
      if (param.type === 'RestElement') {
        return {
          id: param.argument,
          optional: param.optional,
          annotation: param.typeAnnotation.typeAnnotation
        };
      }
      return {
        id: t.identifier(isObjectPattern(param) ? 'arguments[' + i + ']' : param.name),
        optional: param.optional,
        annotation: param.typeAnnotation.typeAnnotation
      };
    }
  }

  function getFunctionArgumentCheckExpressionsAST(node, typeParameters) {
    var params = node.params.map(getParam).filter(function (x) {
      return x;
    });
    return params.map(function (param) {
      return getAssert(param, typeParameters);
    });
  }

  function getParamNameAST(param) {
    if (param.type === 'AssignmentPattern') {
      return getParamNameAST(param.left);
    } else if (param.type === 'RestElement') {
      return t.restElement(param.argument);
    } else if (isObjectPattern(param)) {
      return param;
    }
    return t.identifier(param.name);
  }

  function getWrappedFunctionReturnWithTypeCheckAST(node, typeParameters) {
    var params = node.params.map(getParamNameAST);
    var callParams = params.map(function (param) {
      if (isObjectPattern(param)) {
        return t.objectExpression(param.properties);
      } else if (param.type === 'RestElement') {
        return t.spreadElement(param.argument);
      }
      return param;
    });

    var id = t.identifier('ret');
    var assertAST = getAssert({
      id: id,
      annotation: node.returnType.typeAnnotation,
      name: t.stringLiteral('return value')
    }, typeParameters);

    return [t.variableDeclaration('const', [t.variableDeclarator(id, t.callExpression(t.memberExpression(t.functionExpression(null, params, node.body), t.identifier('call')), [t.identifier('this')].concat(callParams)))]), assertAST, t.returnStatement(id)];
  }

  function getTypeParameters(path) {
    if (path) {
      var _ret = function () {
        var node = path.node;
        var typeParameters = getTypeParameters(path.parentPath);
        if (node.typeParameters) {
          typeParameters = typeParameters || {};
          node.typeParameters.params.forEach(function (param) {
            return typeParameters[param.name] = true;
          });
        }
        return {
          v: typeParameters
        };
      }();

      if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
    }
  }

  function getTypeAliasDefinition(path) {
    var node = path.node;
    var typeParameters = getTypeParameters(path);
    var isRecursive = isRecursiveType(node);
    var args = {
      annotation: node.right,
      typeParameters: typeParameters
    };

    if (isRecursive) {
      return [defineDeclareCombinator(node), t.callExpression(t.memberExpression(node.id, t.identifier('define')), [getType(args)])];
    }

    args.typeName = t.stringLiteral(node.id.name);
    return t.variableDeclaration('const', [t.variableDeclarator(node.id, getType(args))]);
  }

  function defineDeclareCombinator(node) {
    return t.variableDeclaration('const', [t.variableDeclarator(node.id, getDeclareCombinator(t.stringLiteral(node.id.name)))]);
  }

  function getInterfaceDefinitionAST(node, typeParameters) {
    var isRecursive = isRecursiveType(node);
    var args = {
      annotation: node.body,
      typeParameters: typeParameters
    };

    if (isRecursive) {
      return [defineDeclareCombinator(node), t.callExpression(t.memberExpression(node.id, t.identifier('define')), [getType(args)])];
    }

    args.typeName = t.stringLiteral(node.id.name);
    return t.variableDeclaration('const', [t.variableDeclarator(node.id, getType(args))]);
  }

  function getExtendedInterfaceDefinitionAST(node) {
    var isRecursive = isRecursiveType(node);
    var props = getObjectExpression(node.body.properties);
    var mixins = node.extends.filter(function (m) {
      return m.id.name !== MAGIC_REFINEMENT_NAME;
    });
    var refinements = node.extends.filter(function (m) {
      return m.id.name === MAGIC_REFINEMENT_NAME;
    });
    var len = refinements.length;
    if (len > 0) {
      props = getInterfaceCombinator(props);
      for (var i = 0; i < len; i++) {
        props = getRefinementCombinator(props, getRefinementPredicateId(refinements[i]));
      }
    }

    if (isRecursive) {
      return [defineDeclareCombinator(node), t.callExpression(t.memberExpression(node.id, t.identifier('define')), [t.callExpression(extendId, [t.arrayExpression(mixins.map(function (inter) {
        return inter.id;
      }).concat(props))])])];
    }

    var typeName = t.stringLiteral(node.id.name);
    return t.variableDeclaration('const', [t.variableDeclarator(node.id, t.callExpression(extendId, [t.arrayExpression(mixins.map(function (inter) {
      return inter.id;
    }).concat(props)), typeName]))]);
  }

  function buildCodeFrameError(path, error) {
    throw path.buildCodeFrameError('[' + PLUGIN_NAME + '] ' + error.message);
  }

  function preventReservedNamesUsage(path) {
    var name = path.node.id.name;
    if (name in RESERVED_NAMES) {
      buildCodeFrameError(path, new Error(name + ' is a reserved interface name for ' + PLUGIN_NAME));
    }
  }

  function hasRecursiveComment(node) {
    return Array.isArray(node.leadingComments) && node.leadingComments.some(function (comment) {
      return (/recursive/.test(comment.value)
      );
    });
  }

  function isRecursiveType(node) {
    return node.isRecursive || hasRecursiveComment(node);
  }

  function replaceTypeDefintion(path, definition) {
    if (Array.isArray(definition)) {
      if (path.parentPath.node.type === 'ExportNamedDeclaration') {
        path.parentPath.replaceWithMultiple([t.exportNamedDeclaration(definition[0], []), definition[1]]);
      } else {
        path.replaceWithMultiple(definition);
      }
    } else {
      path.replaceWith(definition);
    }
  }

  function isExternalImportDeclaration(source) {
    return _path2.default.normalize(source) === source;
  }

  function getExternalImportDeclarationAST(path) {
    var node = path.node;
    var source = node.source.value;
    var typesId = path.scope.generateUidIdentifier(source);
    var importNode = t.variableDeclaration('const', [t.variableDeclarator(typesId, t.callExpression(t.identifier('require'), [t.stringLiteral(source)]))]);
    return [importNode].concat(node.specifiers.map(function (specifier) {
      return t.variableDeclaration('const', [t.variableDeclarator(specifier.local, t.logicalExpression('||', t.memberExpression(typesId, specifier.local), getAnyType()))]);
    }));
  }

  function isRuntimeTypeIntrospection(node) {
    return node.typeAnnotation && node.typeAnnotation.typeAnnotation && node.typeAnnotation.typeAnnotation.id && node.typeAnnotation.typeAnnotation.id.name === MAGIC_REIFY_NAME;
  }

  function getRuntimeTypeIntrospectionAST(node) {
    return node.typeAnnotation.typeAnnotation.typeParameters.params[0].id;
  }

  function isTypeExportNamedDeclaration(node) {
    return node.declaration && (node.declaration.type === 'TypeAlias' || node.declaration.type === 'InterfaceDeclaration');
  }

  //
  // visitors
  //

  return {
    visitor: {

      Program: {
        enter: function enter(path) {
          hasAsserts = false;
          hasTypes = false;
          hasExtend = false;
          tcombId = path.scope.generateUidIdentifier('t');
          assertId = path.scope.generateUidIdentifier('assert');
          extendId = path.scope.generateUidIdentifier('extend');
        },
        exit: function exit(path, state) {
          var isassertTemplateRequired = hasAsserts && !state.opts[SKIP_ASSERTS_OPTION] && !state.opts[SKIP_HELPERS_OPTION];
          var isextendTemplateRequired = hasExtend && !state.opts[SKIP_HELPERS_OPTION];
          var isImportTcombRequired = hasTypes || isassertTemplateRequired || isextendTemplateRequired;

          if (isImportTcombRequired) {
            path.node.body.unshift(t.importDeclaration([t.importDefaultSpecifier(tcombId)], t.stringLiteral('tcomb')));
          }

          if (isassertTemplateRequired) {
            path.node.body.push(assertTemplate({
              assertId: assertId,
              tcombId: tcombId
            }));
          }

          if (isextendTemplateRequired) {
            path.node.body.push(extendTemplate({
              extendId: extendId,
              tcombId: tcombId
            }));
          }
        }
      },

      ImportDeclaration: function ImportDeclaration(path) {
        var node = path.node;
        if (node.importKind === 'type') {
          var source = node.source.value;
          if (isExternalImportDeclaration(source)) {
            hasTypes = true;
            path.replaceWithMultiple(getExternalImportDeclarationAST(path));
          } else {
            // prevent transform-flow-strip-types
            node.importKind = 'value';
          }
        }
      },
      ExportNamedDeclaration: function ExportNamedDeclaration(path) {
        var node = path.node;
        // prevent transform-flow-strip-types
        if (isTypeExportNamedDeclaration(node)) {
          node.exportKind = 'value';
          node.declaration.isRecursive = isRecursiveType(node);
        }
      },
      TypeAlias: function TypeAlias(path) {
        preventReservedNamesUsage(path);
        hasTypes = true;
        replaceTypeDefintion(path, getTypeAliasDefinition(path));
      },
      InterfaceDeclaration: function InterfaceDeclaration(path) {
        preventReservedNamesUsage(path);
        hasTypes = true;
        var node = path.node;
        if (path.node.extends.length > 0) {
          hasExtend = true;
          replaceTypeDefintion(path, getExtendedInterfaceDefinitionAST(node));
        } else {
          var typeParameters = getTypeParameters(path);
          replaceTypeDefintion(path, getInterfaceDefinitionAST(node, typeParameters));
        }
      },
      TypeCastExpression: function TypeCastExpression(path) {
        var node = path.node;
        if (isRuntimeTypeIntrospection(node)) {
          try {
            path.replaceWith(getRuntimeTypeIntrospectionAST(node));
          } catch (error) {
            buildCodeFrameError(path, new Error('Invalid use of ' + MAGIC_REIFY_NAME));
          }
        } else {
          hasAsserts = true;
          path.replaceWith(getAssert({
            id: node.expression,
            annotation: node.typeAnnotation.typeAnnotation
          }));
        }
      },
      Function: function Function(path, state) {
        if (state.opts[SKIP_ASSERTS_OPTION]) {
          return;
        }

        var node = path.node;

        try {
          // Firstly let's replace arrow function expressions into
          // block statement return structures.
          if (node.type === 'ArrowFunctionExpression' && node.expression) {
            node.expression = false;
            node.body = t.blockStatement([t.returnStatement(node.body)]);
          }

          // If we have a return type then we will wrap our entire function
          // body and insert a type check on the returned value.
          if (node.returnType) {
            hasAsserts = true;
            path.get('body').replaceWithMultiple(getWrappedFunctionReturnWithTypeCheckAST(node));
          }

          // Prepend any argument checks to the top of our function body.
          var argumentChecks = getFunctionArgumentCheckExpressionsAST(node);
          if (argumentChecks.length > 0) {
            var _node$body$body;

            hasAsserts = true;
            (_node$body$body = node.body.body).unshift.apply(_node$body$body, _toConsumableArray(argumentChecks));
          }
        } catch (error) {
          buildCodeFrameError(path, error);
        }
      }
    }
  };
};

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; } /*! @preserve
                                                                                                                                                                                                                   *
                                                                                                                                                                                                                   * babel-plugin-tcomb - Babel plugin for static and runtime type checking using Flow and tcomb
                                                                                                                                                                                                                   *
                                                                                                                                                                                                                   * The MIT License (MIT)
                                                                                                                                                                                                                   *
                                                                                                                                                                                                                   * Copyright (c) 2016 Giulio Canti
                                                                                                                                                                                                                   *
                                                                                                                                                                                                                   */

var PLUGIN_NAME = 'babel-plugin-tcomb';
var INTERFACE_COMBINATOR_NAME = 'interface';

//
// plugin magic types
//

var MAGIC_REFINEMENT_NAME = '$Refinement';
var MAGIC_REIFY_NAME = '$Reify';

var RESERVED_NAMES = (_RESERVED_NAMES = {}, _defineProperty(_RESERVED_NAMES, MAGIC_REFINEMENT_NAME, true), _defineProperty(_RESERVED_NAMES, MAGIC_REIFY_NAME, true), _RESERVED_NAMES);

//
// plugin config
//

// useful for tests
var SKIP_HELPERS_OPTION = 'skipHelpers';
// useful for keeping the models
var SKIP_ASSERTS_OPTION = 'skipAsserts';