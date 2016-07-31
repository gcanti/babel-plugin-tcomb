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

const flowMagicTypes = {
  '$Shape': true,
  '$Keys': true,
  '$Diff': true,
  '$Abstract': true,
  '$Subtype': true
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

  const assertTemplate = expression(`
    function assertId(x, type, name) {
      if (tcombId.isType(type) && type.meta.kind !== 'struct') {
        type(x, [name + ': ' + tcombId.getTypeName(type)]);
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

  //
  // combinators
  //

  function addTypeName(combinatorArguments, typeName) {
    if (t.isStringLiteral(typeName)) {
      combinatorArguments.push(typeName)
    }
    return combinatorArguments
  }

  function callCombinator(combinatorId, combinatorArguments, typeName) {
    return t.callExpression(
      t.memberExpression(tcombId, combinatorId),
      addTypeName(combinatorArguments, typeName)
    )
  }

  function getListCombinator(type, name) {
    return callCombinator(t.identifier('list'), [type], name)
  }

  function getMaybeCombinator(type, name) {
    return callCombinator(t.identifier('maybe'), [type], name)
  }

  function getTupleCombinator(types, name) {
    return callCombinator(t.identifier('tuple'), [t.arrayExpression(types)], name)
  }

  function getUnionCombinator(types, name) {
    return callCombinator(t.identifier('union'), [t.arrayExpression(types)], name)
  }

  function getEnumsCombinator(enums, name) {
    return t.callExpression(
      t.memberExpression(t.memberExpression(tcombId, t.identifier('enums')), t.identifier('of')),
      addTypeName([t.arrayExpression(enums.map(e => t.stringLiteral(e)))], name)
    )
  }

  function getDictCombinator(domain, codomain, name) {
    return callCombinator(t.identifier('dict'), [domain, codomain], name)
  }

  function getRefinementCombinator(type, predicate, name) {
    return callCombinator(t.identifier('refinement'), [type, predicate], name)
  }

  function getInterfaceCombinator(props, name) {
    return callCombinator(t.identifier('interface'), [props], name)
  }

  function getDeclareCombinator(name) {
    return callCombinator(t.identifier('declare'), [name])
  }

  function getIntersectionCombinator(types, name) {
    const intersections = types.filter(t => !(t[REFINEMENT_PREDICATE_ID_STORE_FIELD]))
    const refinements = types.filter(t => t[REFINEMENT_PREDICATE_ID_STORE_FIELD])
    let intersection = intersections.length > 1 ?
      t.callExpression(
        t.memberExpression(tcombId, t.identifier('intersection')),
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
    return getTcombType(t.identifier('Function'))
  }

  function getObjectType() {
    return getTcombType(t.identifier('Object'))
  }

  function getNumberType() {
    return getTcombType(t.identifier('Number'))
  }

  function getStringType() {
    return getTcombType(t.identifier('String'))
  }

  function getBooleanType() {
    return getTcombType(t.identifier('Boolean'))
  }

  function getVoidType() {
    return getTcombType(t.identifier('Nil'))
  }

  function getNullType() {
    return getTcombType(t.identifier('Nil'))
  }

  function getAnyType() {
    return getTcombType(t.identifier('Any'))
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
        const name = t.identifier(prop.key.name)
        let type = getType(prop.value, typeParameters)
        if (prop.optional) {
          type = getMaybeCombinator(type)
        }
        return t.objectProperty(name, type)
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

  function shouldReturnAnyType(name, typeParameters) {
     // this plugin doesn't handle generics by design
    return isTypeParameter(name, typeParameters) || flowMagicTypes.hasOwnProperty(name)
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
        return getInterfaceCombinator(getObjectExpression(annotation.properties, typeParameters), typeName)

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

      default :
        throw new Error(`Unsupported type annotation: ${annotation.type}`)
    }
  }

  function getAssertArgumentName(id) {
    return generate(id, { concise: true }).code
  }

  function getAssertCallExpression(id, annotation, typeParameters, name, optional) {
    let type = getType(annotation, typeParameters)
    if (optional) {
      type = getMaybeCombinator(type)
    }
    name = name || t.stringLiteral(getAssertArgumentName(id))
    return t.callExpression(
      assertId,
      [id, type, name]
    )
  }

  function getAssert({ id, optional, annotation, name }, typeParameters) {
    return t.expressionStatement(getAssertCallExpression(id, annotation, typeParameters, name, optional))
  }

  function getParam(param, i) {
    if (t.isAssignmentPattern(param) && param.left.typeAnnotation) {
      return getParam(param.left, i)
    }
    else if (param.typeAnnotation) {
      if (t.isRestElement(param)) {
        return {
          id: param.argument,
          optional: param.optional,
          annotation: param.typeAnnotation.typeAnnotation
        }
      }
      return {
        id: t.identifier(t.isObjectPattern(param) ? 'arguments[' + i + ']' : param.name),
        optional: param.optional,
        annotation: param.typeAnnotation.typeAnnotation
      }
    }
  }

  function getFunctionArgumentCheckExpressions(node, typeParameters) {
    const params = node.params.map(getParam).filter(x => x)
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
      return param
    }
    return t.identifier(param.name)
  }

  function getWrappedFunctionReturnWithTypeCheck(node, typeParameters) {
    const params = node.params.map(getParamName)
    const callParams = params.map(param => {
      if (t.isObjectPattern(param)) {
        return t.objectExpression(param.properties)
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

    return [
      t.variableDeclaration('const', [
        t.variableDeclarator(
          id,
          t.callExpression(
            t.memberExpression(t.functionExpression(null, params, node.body), t.identifier('call')),
            [t.identifier('this')].concat(callParams)
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
    const importNode = t.variableDeclaration('const', [
      t.variableDeclarator(
        typesId,
        t.callExpression(t.identifier('require'), [t.stringLiteral(source)])
      )
    ])
    return [importNode].concat(node.specifiers.map(specifier => {
      return t.variableDeclaration('const', [
        t.variableDeclarator(
          specifier.local,
          t.logicalExpression(
            '||',
            t.memberExpression(typesId, specifier.imported),
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

        enter(path) {
          hasAsserts = false
          hasTypes = false
          hasExtend = false
          tcombId = path.scope.generateUidIdentifier('t')
          assertId = path.scope.generateUidIdentifier('assert')
          extendId = path.scope.generateUidIdentifier('extend')
          recursiveTypes = []
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
          path.replaceWith(getAssert({
            id: node.expression,
            annotation: node.typeAnnotation.typeAnnotation
          }), getTypeParameters(node))
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

        if (node.kind !== 'const') {
          return
        }

        node.declarations.forEach(declarator => {
          const id = declarator.id

          if (!id.typeAnnotation) {
            return
          }

          hasAsserts = true
          declarator.init = getAssertCallExpression(
            declarator.init,
            id.typeAnnotation.typeAnnotation,
            node[TYPE_PARAMETERS_STORE_FIELD],
            t.stringLiteral(getAssertArgumentName(id))
          )
        })
      },

      Function(path, state) {
        if (state.opts[SKIP_ASSERTS_OPTION]) {
          return
        }

        const node = path.node
        const typeParameters = assign(getTypeParameters(node), node[TYPE_PARAMETERS_STORE_FIELD])

        // store type parameters so we can read them later
        path.traverse({
          'Function|VariableDeclaration'({ node }) {
            node[TYPE_PARAMETERS_STORE_FIELD] = assign(typeParameters, node[TYPE_PARAMETERS_STORE_FIELD])
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
          if (node.returnType) {
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
