/*! @preserve
 *
 * babel-plugin-tcomb - Babel plugin for static and runtime type checking using Flow and tcomb
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2016 Giulio Canti
 *
 */

import generate from 'babel-generator'

const PLUGIN_NAME = 'babel-plugin-tcomb'
const TYPE_PARAMETERS_STORE_FIELD = '__babel_plugin_tcomb_typeParametersStoreField'
const IS_RECURSIVE_STORE_FIELD = '__babel_plugin_tcomb_isRecursiveStoreField'
const REFINEMENT_PREDICATE_ID_STORE_FIELD = '__babel_plugin_tcomb_refinementPredicateIdStoreField'
const PROCESSED_FUNCTION_STORE_FIELD = '__babel_plugin_tcomb_ProcessedFunctionField'

const flowMagicTypes = {
  '$Shape': true,
  '$Keys': true,
  '$Diff': true,
  '$Abstract': true,
  '$Subtype': true,
  '$ObjMap': true
}

// plugin magic types
const MAGIC_REFINEMENT_NAME = '$Refinement'
const MAGIC_REIFY_NAME = '$Reify'
const RESERVED_NAMES = {
  [MAGIC_REFINEMENT_NAME]: true,
  [MAGIC_REIFY_NAME]: true
}

// plugin config

// useful for tests
const SKIP_HELPERS_OPTION = 'skipHelpers'
// useful for keeping the models
const SKIP_ASSERTS_OPTION = 'skipAsserts'
const WARN_ON_FAILURE_OPTION = 'warnOnFailure'

function assign(x, y) {
  if (y) {
    for (let k in y) {
      x[k] = y[k]
    }
  }
  return x
}

export default function ({ types: t, template }) {

  let tcombId = null
  let assertId = null
  let extendId = null
  let hasTypes = false
  let hasAsserts = false
  let hasExtend = false
  let recursiveTypes = []
  let globals

  const assertTemplate = expression(`
    function assertId(x, type, name) {
      if (warnOnFailure) {
        tcombId.fail = function (message) { console.warn(message); };
      }
      if (tcombId.isType(type) && type.meta.kind !== 'struct') {
        if (!type.is(x)) {
          type(x, [name + ': ' + tcombId.getTypeName(type)]);
        }
      } else if (!(x instanceof type)) {
        tcombId.fail('Invalid value ' + tcombId.stringify(x) + ' supplied to ' + name + ' (expected a ' + tcombId.getTypeName(type) + ')');
      }
      return x;
    }
  `)

  const extendTemplate = expression(`
    function extendId(types, name) {
      const isAny = (type) => {
        if (type === tcombId.Any) {
          return true;
        }
        if (tcombId.isType(type) && type.meta.kind === 'maybe') {
          return isAny(type.meta.type)
        }
        return false;
      }
      return tcombId.interface.extend(types.filter(type => !isAny(type)), name)
    }
  `)

  const argumentsTemplate = expression(`arguments[index] !== undefined ? arguments[index] : defaults`)

  //
  // combinators
  //

  function addTypeName(combinatorArguments, typeName, exact) {
    if (t.isStringLiteral(typeName)) {
      if (exact) {
        combinatorArguments.push(t.objectExpression([
          t.objectProperty(t.identifier('name'), typeName),
          t.objectProperty(t.identifier('strict'), t.booleanLiteral(true))
        ]))
      }
      else {
        combinatorArguments.push(typeName)
      }
    }
    else if (exact) {
      combinatorArguments.push(t.objectExpression([
        t.objectProperty(t.identifier('strict'), t.booleanLiteral(true))
      ]))
    }
    return combinatorArguments
  }

  function callCombinator(combinatorId, combinatorArguments, typeName) {
    return t.callExpression(
      t.memberExpression(tcombId, combinatorId),
      addTypeName(combinatorArguments, typeName)
    )
  }

  const listId = t.identifier('list')
  const tupleId = t.identifier('tuple')
  const maybeId = t.identifier('maybe')
  const unionId = t.identifier('union')
  const dictId = t.identifier('dict')
  const refinementId = t.identifier('refinement')
  const interfaceId = t.identifier('interface')
  const declareId = t.identifier('declare')
  const intersectionId = t.identifier('intersection')
  const functionId = t.identifier('Function')
  const objectId = t.identifier('Object')
  const nilId = t.identifier('Nil')
  const numberId = t.identifier('Number')
  const stringId = t.identifier('String')
  const booleanId = t.identifier('Boolean')
  const anyId = t.identifier('Any')

  function getEmptyType() {
    return t.callExpression(
      t.memberExpression(tcombId, t.identifier('irreducible')),
      [
        t.stringLiteral('Empty'),
        t.functionExpression(null, [], t.blockStatement([
          t.returnStatement(
            t.booleanLiteral(false)
          )
        ]))
      ]
    )
  }

  function getListCombinator(type, name) {
    return callCombinator(listId, [type], name)
  }

  function getMaybeCombinator(type, name) {
    return callCombinator(maybeId, [type], name)
  }

  function getTupleCombinator(types, name) {
    return callCombinator(tupleId, [t.arrayExpression(types)], name)
  }

  function getUnionCombinator(types, name) {
    return callCombinator(unionId, [t.arrayExpression(types)], name)
  }

  function getEnumsCombinator(enums, name) {
    return t.callExpression(
      t.memberExpression(t.memberExpression(tcombId, t.identifier('enums')), t.identifier('of')),
      addTypeName([t.arrayExpression(enums.map(e => t.stringLiteral(e)))], name)
    )
  }

  function getDictCombinator(domain, codomain, name) {
    return callCombinator(dictId, [domain, codomain], name)
  }

  function getRefinementCombinator(type, predicate, name) {
    return callCombinator(refinementId, [type, predicate], name)
  }

  function getInterfaceCombinator(props, name, exact) {
    return t.callExpression(
      t.memberExpression(tcombId, interfaceId),
      addTypeName([props], name, exact)
    )
  }

  function getDeclareCombinator(name) {
    return callCombinator(declareId, [name])
  }

  function getIntersectionCombinator(types, name) {
    const intersections = types.filter(t => !(t[REFINEMENT_PREDICATE_ID_STORE_FIELD]))
    const refinements = types.filter(t => t[REFINEMENT_PREDICATE_ID_STORE_FIELD])
    let intersection = intersections.length > 1 ?
      t.callExpression(
        t.memberExpression(tcombId, intersectionId),
        addTypeName([t.arrayExpression(intersections)], name)
      ) :
      intersections[0]
    const len = refinements.length
    if (len > 0) {
      for (let i = 0; i < len; i++) {
        intersection = getRefinementCombinator(intersection, refinements[i][REFINEMENT_PREDICATE_ID_STORE_FIELD], name)
      }
    }
    return intersection
  }

  //
  // Flow types
  //

  function getTcombType(id) {
    return t.memberExpression(tcombId, id)
  }

  function getFunctionType() {
    return getTcombType(functionId)
  }

  function getObjectType() {
    return getTcombType(objectId)
  }

  function getNumberType() {
    return getTcombType(numberId)
  }

  function getStringType() {
    return getTcombType(stringId)
  }

  function getBooleanType() {
    return getTcombType(booleanId)
  }

  function getVoidType() {
    return getTcombType(nilId)
  }

  function getNullType() {
    return getTcombType(nilId)
  }

  function getAnyType() {
    return getTcombType(anyId)
  }

  function getNumericLiteralType(value) {
    const n = t.identifier('n')
    const predicate = t.functionExpression(null, [n], t.blockStatement([
      t.returnStatement(
        t.binaryExpression(
          '===',
          n,
          t.numericLiteral(value)
        )
      )
    ]))
    return getRefinementCombinator(getNumberType(), predicate)
  }

  function getBooleanLiteralType(value) {
    const b = t.identifier('b')
    const type = getBooleanType()
    const predicate = t.functionExpression(null, [b], t.blockStatement([
      t.returnStatement(
        t.binaryExpression(
          '===',
          b,
          t.booleanLiteral(value)
        )
      )
    ]))
    return getRefinementCombinator(type, predicate)
  }

  //
  // helpers
  //

  function getExpression(node) {
    return t.isExpressionStatement(node) ? node.expression : node
  }

  function expression(input) {
    const fn = template(input)
    return function (args) {
      const node = fn(args)
      return getExpression(node)
    }
  }

  function getObjectExpression(properties, typeParameters) {
    const props = properties
      .map(prop => {
        let type = getType(prop.value, typeParameters)
        if (prop.optional) {
          type = getMaybeCombinator(type)
        }
        return t.objectProperty(prop.key, type)
      })
    return t.objectExpression(props)
  }

  function getExpressionFromGenericTypeAnnotation(id) {
    if (t.isQualifiedTypeIdentifier(id)) {
      return t.memberExpression(getExpressionFromGenericTypeAnnotation(id.qualification), t.identifier(id.id.name))
    }
    return id
  }

  function getRefinementPredicateId(annotation) {
    if (annotation.typeParameters.params.length !== 1 || !annotation.typeParameters.params[0].argument) {
      throw new Error(`Invalid refinement definition, example: $Refinement<typeof predicate>`)
    }
    return getExpressionFromGenericTypeAnnotation(annotation.typeParameters.params[0].argument.id)
  }

  function isTypeParameter(name, typeParameters) {
    return typeParameters && typeParameters.hasOwnProperty(name)
  }

  function isGlobalType(name) {
    return globals && globals.hasOwnProperty(name)
  }

  function shouldReturnAnyType(name, typeParameters) {
     // this plugin doesn't handle generics by design
    return isGlobalType(name) || isTypeParameter(name, typeParameters) || flowMagicTypes.hasOwnProperty(name)
  }

  function getGenericTypeAnnotation(annotation, typeParameters, typeName) {
    const name = annotation.id.name
    if (name === 'Array') {
      if (!annotation.typeParameters || annotation.typeParameters.params.length !== 1) {
        throw new Error(`Unsupported Array type annotation: incorrect number of type parameters (expected 1)`)
      }
      const typeParameter = annotation.typeParameters.params[0]
      return getListCombinator(getType(typeParameter, typeParameters), typeName)
    }
    if (name === 'Function') {
      return getFunctionType()
    }
    if (name === 'Object') {
      return getObjectType()
    }
    if (name === '$Exact') {
      return getInterfaceCombinator(getObjectExpression(annotation.typeParameters.params[0].properties, typeParameters), typeName, true)
    }
    if (shouldReturnAnyType(name, typeParameters)) {
      return getAnyType()
    }
    const gta = getExpressionFromGenericTypeAnnotation(annotation.id)
    if (name === MAGIC_REFINEMENT_NAME) {
      gta[REFINEMENT_PREDICATE_ID_STORE_FIELD] = getRefinementPredicateId(annotation)
    }
    return gta
  }

  function getType(annotation, typeParameters, typeName) {
    switch (annotation.type) {

      case 'GenericTypeAnnotation' :
        return getGenericTypeAnnotation(annotation, typeParameters, typeName)

      case 'ArrayTypeAnnotation' :
        return getListCombinator(getType(annotation.elementType, typeParameters), typeName)

      case 'NullableTypeAnnotation' :
        return getMaybeCombinator(getType(annotation.typeAnnotation, typeParameters), typeName)

      case 'TupleTypeAnnotation' :
        return getTupleCombinator(annotation.types.map(annotation => getType(annotation, typeParameters)), typeName)

      case 'UnionTypeAnnotation' :
        // handle enums
        if (annotation.types.every(n => t.isStringLiteralTypeAnnotation(n))) {
          return getEnumsCombinator(annotation.types.map(n => n.value), typeName)
        }
        return getUnionCombinator(annotation.types.map(annotation => getType(annotation, typeParameters)), typeName)

      case 'ObjectTypeAnnotation' :
        if (annotation.indexers.length === 1) {
          return getDictCombinator(
            getType(annotation.indexers[0].key, typeParameters),
            getType(annotation.indexers[0].value, typeParameters),
            typeName
          )
        }
        return getInterfaceCombinator(getObjectExpression(annotation.properties, typeParameters), typeName, annotation.exact)

      case 'IntersectionTypeAnnotation' :
        return getIntersectionCombinator(annotation.types.map(annotation => getType(annotation, typeParameters)), typeName)

      case 'FunctionTypeAnnotation' :
        return getFunctionType()

      case 'NumberTypeAnnotation' :
        return getNumberType()

      case 'StringTypeAnnotation' :
        return getStringType()

      case 'BooleanTypeAnnotation' :
        return getBooleanType()

      case 'VoidTypeAnnotation' :
        return getVoidType()

      case 'NullLiteralTypeAnnotation' :
        return getNullType()

      case 'TypeofTypeAnnotation' :
      case 'AnyTypeAnnotation' :
      case 'MixedTypeAnnotation' :
      case 'ExistentialTypeParam' :
        return getAnyType()

      case 'StringLiteralTypeAnnotation' :
        return getEnumsCombinator([annotation.value], typeName)

      case 'NumericLiteralTypeAnnotation' :
        return getNumericLiteralType(annotation.value, typeName)

      case 'BooleanLiteralTypeAnnotation' :
        return getBooleanLiteralType(annotation.value, typeName)

      case 'EmptyTypeAnnotation' :
        return getEmptyType()

      default :
        throw new Error(`Unsupported type annotation: ${annotation.type}`)
    }
  }

  function nodeToString(id) {
    return generate(id, { concise: true }).code
  }

  function getAssertCallExpression(id, annotation, typeParameters, name, optional) {
    let type = getType(annotation, typeParameters)
    if (optional) {
      type = getMaybeCombinator(type)
    }
    name = name || t.stringLiteral(nodeToString(id))
    return t.callExpression(
      assertId,
      [id, type, name]
    )
  }

  function getAssert({ id, optional, annotation, name }, typeParameters) {
    return t.expressionStatement(getAssertCallExpression(id, annotation, typeParameters, name, optional))
  }

  function stripDefaults(node) {
    if (t.isObjectPattern(node)) {
      return t.objectExpression(node.properties.map(p => {
        if (t.isRestProperty(p)) {
          return t.spreadProperty(stripDefaults(p.argument))
        }
        return t.objectProperty(p.key, stripDefaults(p.value), false, true)
      }))
    }
    else if (t.isAssignmentPattern(node)) {
      return stripDefaults(node.left)
    }
    return node
  }

  function getParamId(isArrow, param, i, defaults) {
    if (t.isObjectPattern(param)) {
      if (isArrow) {
        return stripDefaults(param)
      }
      if (typeof defaults !== 'undefined') {
        return argumentsTemplate({ index: t.identifier(i), defaults })
      }
      return t.memberExpression(t.identifier('arguments'), t.identifier(i), true)
    }
    if (t.isRestElement(param)) {
      return param.argument
    }
    return param
  }

  function getParam(isArrow, param, i, defaults) {
    if (t.isAssignmentPattern(param) && param.left.typeAnnotation) {
      return getParam(isArrow, param.left, i, param.right)
    }
    if (param.typeAnnotation) {
      const id = getParamId(isArrow, param, i, defaults)

      return {
        id,
        optional: param.optional,
        annotation: param.typeAnnotation.typeAnnotation,
        name: t.stringLiteral(nodeToString(t.isRestElement(param) ? param.argument : param))
      }
    }
  }

  function getFunctionArgumentCheckExpressions(node, typeParameters) {
    const isArrow = t.isArrowFunctionExpression(node)
    const params = node.params.map((param, i) => getParam(isArrow, param, i)).filter(x => x)
    return params.map(param => getAssert(param, typeParameters))
  }

  function getParamName(param) {
    if (t.isAssignmentPattern(param)) {
      return getParamName(param.left)
    }
    else if (t.isRestElement(param)) {
      return t.restElement(param.argument)
    }
    else if (t.isObjectPattern(param)) {
      return t.objectPattern(param.properties.map(p => {
        return t.objectProperty(p.key, stripDefaults(p.value), false, true)
      }))
    }
    return t.identifier(param.name)
  }

  function stripValueFromProperty(property) {
    return t.objectProperty(property.key, property.key, false, true)
  }

  function getWrappedFunctionReturnWithTypeCheck(node, typeParameters) {
    const params = node.params.map(getParamName)
    const callParams = params.map(param => {
      if (t.isObjectPattern(param)) {
        return t.objectExpression(param.properties.map(stripValueFromProperty))
      }
      else if (t.isRestElement(param)) {
        return t.spreadElement(param.argument)
      }
      return param
    })

    const id = t.identifier('ret')
    const assertAST = getAssert({
      id,
      annotation: node.returnType.typeAnnotation,
      name: t.stringLiteral('return value')
    }, typeParameters)

    const f = t.functionExpression(null, params, node.body)
    f[PROCESSED_FUNCTION_STORE_FIELD] = true
    return [
      t.variableDeclaration('const', [
        t.variableDeclarator(
          id,
          t.callExpression(
            t.memberExpression(f, t.identifier('call')),
            [t.thisExpression()].concat(callParams)
          )
        )
      ]),
      assertAST,
      t.returnStatement(id)
    ]
  }

  function getTypeParameterName(param) {
    if (t.isGenericTypeAnnotation(param)) {
      return param.id.name
    }
    return param.name
  }

  function getTypeParameters(node) {
    const typeParameters = {}
    if (node.typeParameters) {
      node.typeParameters.params.forEach(param => typeParameters[getTypeParameterName(param)] = true)
    }
    return typeParameters
  }

  function getTypeAliasDefinition(path) {
    const node = path.node
    const typeParameters = getTypeParameters(node)
    const isRecursive = isRecursiveType(node)
    const annotation = node.right

    if (isRecursive) {
      recursiveTypes.push(
        t.callExpression(
          t.memberExpression(node.id, t.identifier('define')),
          [getType(annotation, typeParameters)]
        )
      )
      return defineDeclareCombinator(node)
    }

    const typeName = t.stringLiteral(node.id.name)
    return t.variableDeclaration('const', [
      t.variableDeclarator(node.id, getType(annotation, typeParameters, typeName))
    ])
  }

  function defineDeclareCombinator(node) {
    return t.variableDeclaration('const', [
      t.variableDeclarator(node.id, getDeclareCombinator(t.stringLiteral(node.id.name)))
    ])
  }

  function getInterfaceDefinition(node, typeParameters) {
    const isRecursive = isRecursiveType(node)
    const annotation = node.body

    if (isRecursive) {
      recursiveTypes.push(
        t.callExpression(
          t.memberExpression(node.id, t.identifier('define')),
          [getType(annotation, typeParameters)]
        )
      )
      return defineDeclareCombinator(node)
    }

    const typeName = t.stringLiteral(node.id.name)
    return t.variableDeclaration('const', [
      t.variableDeclarator(node.id, getType(annotation, typeParameters, typeName))
    ])
  }

  function getExtendedInterfaceDefinition(node, typeParameters) {
    const isRecursive = isRecursiveType(node)
    const mixins = node.extends.filter(m => m.id.name !== MAGIC_REFINEMENT_NAME)
    typeParameters = mixins.reduce((acc, node) => assign(acc, getTypeParameters(node)), typeParameters)
    const refinements = node.extends.filter(m => m.id.name === MAGIC_REFINEMENT_NAME)
    let props = getObjectExpression(node.body.properties, typeParameters)
    const len = refinements.length
    if (len > 0) {
      props = getInterfaceCombinator(props)
      for (let i = 0; i < len; i++) {
        props = getRefinementCombinator(props, getRefinementPredicateId(refinements[i]))
      }
    }

    if (isRecursive) {
      recursiveTypes.push(
        t.callExpression(
          t.memberExpression(node.id, t.identifier('define')),
          [
            t.callExpression(
              extendId,
              [
                t.arrayExpression(mixins.map(inter => inter.id).concat(props))
              ]
            )
          ]
        )
      )
      return defineDeclareCombinator(node)
    }

    const typeName = t.stringLiteral(node.id.name)
    return t.variableDeclaration('const', [
      t.variableDeclarator(
        node.id,
        t.callExpression(
          extendId,
          [
            t.arrayExpression(mixins.map(inter => inter.id).concat(props)),
            typeName
          ]
        )
      )
    ])
  }

  function buildCodeFrameError(path, error) {
    throw path.buildCodeFrameError(`[${PLUGIN_NAME}] ${error.message}`)
  }

  function preventReservedNamesUsage(path) {
    const name = path.node.id.name
    if (name in RESERVED_NAMES) {
      buildCodeFrameError(path, new Error(`${name} is a reserved interface name for ${PLUGIN_NAME}`))
    }
  }

  function hasRecursiveComment(node) {
    return Array.isArray(node.leadingComments) && node.leadingComments.some(comment => /recursive/.test(comment.value))
  }

  function isRecursiveType(node) {
    return node[IS_RECURSIVE_STORE_FIELD] || hasRecursiveComment(node)
  }

  function isExternalImportDeclaration(source) {
    return !(source.indexOf('./') === 0 || source.indexOf('../') === 0)
  }

  function getExternalImportDeclaration(path) {
    const node = path.node
    const source = node.source.value
    const typesId = path.scope.generateUidIdentifier(source)
    const importNode = t.importDeclaration([
      t.importNamespaceSpecifier(typesId)
    ], t.stringLiteral(source))
    return [importNode].concat(node.specifiers.map(specifier => {
      const isDefaultImport = specifier.type === 'ImportDefaultSpecifier'
      return t.variableDeclaration('const', [
        t.variableDeclarator(
          specifier.local,
          t.logicalExpression(
            '||',
            t.memberExpression(typesId, isDefaultImport ? t.identifier('default') : specifier.imported),
            getAnyType()
          )
        )
      ])
    }))
  }

  function isRuntimeTypeIntrospection(node) {
    return node.typeAnnotation &&
           node.typeAnnotation.typeAnnotation &&
           node.typeAnnotation.typeAnnotation.id &&
           node.typeAnnotation.typeAnnotation.id.name === MAGIC_REIFY_NAME
  }

  function getRuntimeTypeIntrospection(node) {
    return node.typeAnnotation.typeAnnotation.typeParameters.params[0].id
  }

  function isTypeExportNamedDeclaration(node) {
    return node.declaration && ( t.isTypeAlias(node.declaration) || t.isInterfaceDeclaration(node.declaration) )
  }

  //
  // visitors
  //

  return {
    visitor: {

      Program: {

        enter(path, state) {
          hasAsserts = false
          hasTypes = false
          hasExtend = false
          tcombId = path.scope.generateUidIdentifier('t')
          assertId = path.scope.generateUidIdentifier('assert')
          extendId = path.scope.generateUidIdentifier('extend')
          recursiveTypes = []
          if (!globals && state.opts.globals) {
            globals = state.opts.globals.reduce((acc, x) => assign(acc, x), {})
          }
        },

        exit(path, state) {
          const isAssertTemplateRequired = hasAsserts && !state.opts[SKIP_HELPERS_OPTION]
          const isExtendTemplateRequired = hasExtend && !state.opts[SKIP_HELPERS_OPTION]
          const isImportTcombRequired = hasTypes || isAssertTemplateRequired || isExtendTemplateRequired

          if (isImportTcombRequired) {
            path.node.body.unshift(
              t.importDeclaration([t.importDefaultSpecifier(tcombId)], t.stringLiteral('tcomb'))
            )
          }

          Array.prototype.push.apply(path.node.body, recursiveTypes)

          if (isAssertTemplateRequired) {
            path.node.body.push(assertTemplate({
              warnOnFailure: t.booleanLiteral(!!state.opts[WARN_ON_FAILURE_OPTION]),
              assertId,
              tcombId
            }))
          }

          if (isExtendTemplateRequired) {
            path.node.body.push(extendTemplate({
              extendId,
              tcombId
            }))
          }
        }

      },

      ImportDeclaration(path) {
        const node = path.node
        if (node.importKind === 'type') {
          const source = node.source.value
          if (isExternalImportDeclaration(source)) {
            hasTypes = true
            path.replaceWithMultiple(getExternalImportDeclaration(path))
          }
          else {
            // prevent transform-flow-strip-types
            node.importKind = 'value'
          }
        }
      },

      ExportNamedDeclaration(path) {
        const node = path.node
        // prevent transform-flow-strip-types
        if (isTypeExportNamedDeclaration(node)) {
          node.exportKind = 'value'
          node.declaration[IS_RECURSIVE_STORE_FIELD] = isRecursiveType(node)
        }
      },

      TypeAlias(path) {
        preventReservedNamesUsage(path)
        hasTypes = true
        path.replaceWith(getTypeAliasDefinition(path))
      },

      InterfaceDeclaration(path) {
        preventReservedNamesUsage(path)
        hasTypes = true
        const node = path.node
        const typeParameters = getTypeParameters(node)
        if (path.node.extends.length > 0) {
          hasExtend = true
          path.replaceWith(getExtendedInterfaceDefinition(node, typeParameters))
        }
        else {
          path.replaceWith(getInterfaceDefinition(node, typeParameters))
        }
      },

      TypeCastExpression(path, state) {
        const node = path.node
        if (isRuntimeTypeIntrospection(node)) {
          try {
            path.replaceWith(getRuntimeTypeIntrospection(node))
          }
          catch (error) {
            buildCodeFrameError(path, new Error(`Invalid use of ${MAGIC_REIFY_NAME}, example: const ReifiedMyType = (({}: any): $Reify<MyType>)`))
          }
        }
        else {
          if (state.opts[SKIP_ASSERTS_OPTION]) {
            return
          }
          hasAsserts = true
          const typeParameters = assign(getTypeParameters(node), node[TYPE_PARAMETERS_STORE_FIELD])
          path.replaceWith(getAssert({
            id: node.expression,
            annotation: node.typeAnnotation.typeAnnotation
          }, typeParameters))
        }
      },

      Class(path) {
        // store type parameters so we can read them later
        const node = path.node
        const typeParameters = getTypeParameters(node)
        path.traverse({
          Function({ node }) {
            node[TYPE_PARAMETERS_STORE_FIELD] = assign(typeParameters, node[TYPE_PARAMETERS_STORE_FIELD])
          }
        })
      },

      VariableDeclaration(path, state) {
        if (state.opts[SKIP_ASSERTS_OPTION]) {
          return
        }

        const node = path.node

        if (node.kind === 'var') {
          return
        }

        for (var i = 0, len = node.declarations.length ; i < len ; i++ ) {
          const declarator = node.declarations[i]
          const id = declarator.id

          if (!id.typeAnnotation) {
            return
          }

          hasAsserts = true
          declarator.init = getAssertCallExpression(
            declarator.init,
            id.typeAnnotation.typeAnnotation,
            node[TYPE_PARAMETERS_STORE_FIELD],
            t.stringLiteral(nodeToString(id))
          )
        }
      },

      Function(path, state) {
        const node = path.node
        if (state.opts[SKIP_ASSERTS_OPTION] || node[PROCESSED_FUNCTION_STORE_FIELD]) {
          return
        }
        node[PROCESSED_FUNCTION_STORE_FIELD] = true

        let isAsync = false
        const typeParameters = assign(getTypeParameters(node), node[TYPE_PARAMETERS_STORE_FIELD])

        // store type parameters so we can read them later
        path.traverse({
          'Function|VariableDeclaration|TypeCastExpression'({ node }) {
            node[TYPE_PARAMETERS_STORE_FIELD] = assign(typeParameters, node[TYPE_PARAMETERS_STORE_FIELD])
          },
          AwaitExpression() {
            isAsync = true
          }
        })

        try {
          // Firstly let's replace arrow function expressions into
          // block statement return structures.
          if (t.isArrowFunctionExpression(node) && node.expression) {
            node.expression = false
            node.body = t.blockStatement([t.returnStatement(node.body)])
          }

          // If we have a return type then we will wrap our entire function
          // body and insert a type check on the returned value.
          if (node.returnType && !isAsync) {
            hasAsserts = true
            path.get('body').replaceWithMultiple(getWrappedFunctionReturnWithTypeCheck(node, typeParameters))
          }

          // Prepend any argument checks to the top of our function body.
          const argumentChecks = getFunctionArgumentCheckExpressions(node, typeParameters)
          if (argumentChecks.length > 0) {
            hasAsserts = true
            node.body.body.unshift(...argumentChecks)
          }
        }
        catch (error) {
          buildCodeFrameError(path, error)
        }
      }
    }
  }
}
