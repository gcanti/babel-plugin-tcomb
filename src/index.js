/*! @preserve
 *
 * babel-plugin-tcomb - Babel plugin for static and runtime type checking using Flow and tcomb
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2016 Giulio Canti
 *
 */

import path from 'path'
import generate from 'babel-generator'
import find from 'lodash.find'

const PLUGIN_NAME = 'babel-plugin-tcomb'
const INTERFACE_COMBINATOR_NAME = 'interface'

//
// plugin magic types
//

const MAGIC_REFINEMENT_NAME = '$Refinement'
const MAGIC_REIFY_NAME = '$Reify'

const RESERVED_NAMES = {
  [MAGIC_REFINEMENT_NAME]: true,
  [MAGIC_REIFY_NAME]: true
}

//
// plugin config
//

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

  function getListCombinator(type, name) {
    return t.callExpression(
      t.memberExpression(tcombId, t.identifier('list')),
      addTypeName([type], name)
    )
  }

  function getMaybeCombinator(type, name) {
    return t.callExpression(
      t.memberExpression(tcombId, t.identifier('maybe')),
      addTypeName([type], name)
    )
  }

  function getTupleCombinator(types, name) {
    return t.callExpression(
      t.memberExpression(tcombId, t.identifier('tuple')),
      addTypeName([t.arrayExpression(types)], name)
    )
  }

  function getUnionCombinator(types, name) {
    return t.callExpression(
      t.memberExpression(tcombId, t.identifier('union')),
      addTypeName([t.arrayExpression(types)], name)
    )
  }

  function getEnumsCombinator(enums, name) {
    return t.callExpression(
      t.memberExpression(t.memberExpression(tcombId, t.identifier('enums')), t.identifier('of')),
      addTypeName([t.arrayExpression(enums.map(e => t.stringLiteral(e)))], name)
    )
  }

  function getDictCombinator(domain, codomain, name) {
    return t.callExpression(
      t.memberExpression(tcombId, t.identifier('dict')),
      addTypeName([domain, codomain], name)
    )
  }

  function getRefinementCombinator(type, predicate, name) {
    return t.callExpression(
      t.memberExpression(tcombId, t.identifier('refinement')),
      addTypeName([type, predicate], name)
    )
  }

  function getIntersectionCombinator(types, name) {
    const intersections = types.filter(t => !(t._refinementPredicateId))
    const refinements = types.filter(t => t._refinementPredicateId)
    let intersection = intersections.length > 1 ?
      t.callExpression(
        t.memberExpression(tcombId, t.identifier('intersection')),
        addTypeName([t.arrayExpression(intersections)], name)
      ) :
      intersections[0]
    const len = refinements.length
    if (len > 0) {
      for (let i = 0; i < len; i++) {
        intersection = getRefinementCombinator(intersection, refinements[i]._refinementPredicateId, name)
      }
    }
    return intersection
  }

  function getInterfaceCombinator(props, name) {
    return t.callExpression(
      t.memberExpression(tcombId, t.identifier(INTERFACE_COMBINATOR_NAME)),
      addTypeName([props], name)
    )
  }

  function getDeclareCombinator(name) {
    return t.callExpression(
      t.memberExpression(tcombId, t.identifier('declare')),
      [name]
    )
  }

  //
  // Flow types
  //

  function getFunctionType() {
    return t.memberExpression(tcombId, t.identifier('Function'))
  }

  function getObjectType() {
    return t.memberExpression(tcombId, t.identifier('Object'))
  }

  function getNumberType() {
    return t.memberExpression(tcombId, t.identifier('Number'))
  }

  function getStringType() {
    return t.memberExpression(tcombId, t.identifier('String'))
  }

  function getBooleanType() {
    return t.memberExpression(tcombId, t.identifier('Boolean'))
  }

  function getVoidType() {
    return t.memberExpression(tcombId, t.identifier('Nil'))
  }

  function getNullType() {
    return t.memberExpression(tcombId, t.identifier('Nil'))
  }

  function getAnyType() {
    return t.memberExpression(tcombId, t.identifier('Any'))
  }

  function getNumericLiteralType(value) {
    const n = t.identifier('n')
    const type = getNumberType()
    const predicate = t.functionExpression(null, [n], t.blockStatement([
      t.returnStatement(
        t.binaryExpression(
          '===',
          n,
          t.numericLiteral(value)
        )
      )
    ]))
    return getRefinementCombinator(type, predicate)
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

  function addTypeName(args, name) {
    if (typeof name === 'object') {
      args.push(name)
    }
    return args
  }

  function getObjectExpression(properties, typeParameters) {
    const props = properties
      .map(prop => {
        const name = t.identifier(prop.key.name)
        let type = getType({ annotation: prop.value, typeParameters })
        if (prop.optional) {
          type = getMaybeCombinator(type)
        }
        return t.objectProperty(name, type)
      })
    return t.objectExpression(props)
  }

  function getExpressionFromGenericTypeAnnotation(id) {
    if (id.type === 'QualifiedTypeIdentifier') {
      return t.memberExpression(getExpressionFromGenericTypeAnnotation(id.qualification), t.identifier(id.id.name))
    }
    return id
  }

  function getRefinementPredicateId(annotation) {
    if (annotation.typeParameters.params.length !== 1 || !annotation.typeParameters.params[0].argument) {
      throw new Error(`Invalid refinement definition, example: Refinement<typeof predicate>`)
    }
    return getExpressionFromGenericTypeAnnotation(annotation.typeParameters.params[0].argument.id)
  }

  function getTypeParameter(name, typeParameters) {
    return typeParameters && typeParameters.hasOwnProperty(name) ? typeParameters[name] : false
  }

  function shouldReturnAnyType(typeParameters, name) {
    // Flow magic types
    return name === '$Shape'
      || name === '$Keys'
      || name === '$Diff'
      || name === '$Abstract'
      || name === '$Subtype'
  }

  function getGenericTypeAnnotation({ annotation, typeName, typeParameters }) {
    const name = annotation.id.name
    if (name === 'Array') {
      if (!annotation.typeParameters || annotation.typeParameters.params.length !== 1) {
        throw new Error(`Unsupported Array type annotation: incorrect number of type parameters (expected 1)`)
      }
      const typeParameter = annotation.typeParameters.params[0]
      return getListCombinator(getType({ annotation: typeParameter, typeParameters }), typeName)
    }
    if (name === 'Function') {
      return getFunctionType()
    }
    if (name === 'Object') {
      return getObjectType()
    }

    const typeParameter = getTypeParameter(name, typeParameters)
    if (typeParameter) {
      // only bounded polymorphism is supported at the moment
      if (typeParameter.bound)
        return getType({
          annotation: typeParameter.bound.typeAnnotation
        })

      return getAnyType()
    }

    if (shouldReturnAnyType(typeParameters, name)) {
      return getAnyType()
    }
    const gta = getExpressionFromGenericTypeAnnotation(annotation.id)
    if (name === MAGIC_REFINEMENT_NAME) {
      gta._refinementPredicateId = getRefinementPredicateId(annotation)
    }
    return gta
  }

  function getType({ annotation, typeName, typeParameters }) {
    switch (annotation.type) {

      case 'GenericTypeAnnotation' :
        return getGenericTypeAnnotation({ annotation, typeName, typeParameters })

      case 'ArrayTypeAnnotation' :
        return getListCombinator(getType({ annotation: annotation.elementType, typeParameters }), typeName)

      case 'NullableTypeAnnotation' :
        return getMaybeCombinator(getType({ annotation: annotation.typeAnnotation, typeParameters }), typeName)

      case 'TupleTypeAnnotation' :
        return getTupleCombinator(annotation.types.map(annotation => getType({ annotation, typeParameters })), typeName)

      case 'UnionTypeAnnotation' :
        // handle enums
        if (annotation.types.every(n => n.type === 'StringLiteralTypeAnnotation')) {
          return getEnumsCombinator(annotation.types.map(n => n.value), typeName)
        }
        return getUnionCombinator(annotation.types.map(annotation => getType({ annotation, typeParameters })), typeName)

      case 'ObjectTypeAnnotation' :
        if (annotation.indexers.length === 1) {
          return getDictCombinator(
            getType({ annotation: annotation.indexers[0].key, typeParameters }),
            getType({ annotation: annotation.indexers[0].value, typeParameters }),
            typeName
          )
        }
        return getInterfaceCombinator(getObjectExpression(annotation.properties, typeParameters), typeName)

      case 'IntersectionTypeAnnotation' :
        return getIntersectionCombinator(annotation.types.map(annotation => getType({ annotation, typeParameters })), typeName)

      case 'FunctionTypeAnnotation' :
        return getFunctionType()
        // return getFuncCombinator(annotation.params.map((param) => getType(param.typeAnnotation)), getType(annotation.returnType), typeName)

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

      case 'AnyTypeAnnotation' :
      case 'MixedTypeAnnotation' :
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
    const type = id.type
    if (type === 'MemberExpression') {
      return `${getAssertArgumentName(id.object)}.${id.property.name}`
    }
    if (type === 'Identifier') {
      return id.name
    }
    return type
  }

  function isSameType(node, annotationType) {
    switch (annotationType) {
      case 'BooleanTypeAnnotation':
        return node.type === 'BooleanLiteral'

      case 'NumberTypeAnnotation':
        return node.type === 'NumericLiteral'

      case 'StringTypeAnnotation':
        return node.type === 'StringLiteral'

      case 'NullLiteralTypeAnnotation':
        return node.type === 'NullLiteral'

      case 'VoidTypeAnnotation':
        return node.type === 'Identifier' && node.name === 'undefined'
    }

    return false
  }

  function getAssertCallExpression({ id, optional, annotation, name }, typeParameters) {
    if (isSameType(id, annotation.type)) {
      // no need to check
      return id
    }

    let typeAST = getType({ annotation, typeParameters })
    if (optional) {
      typeAST = getMaybeCombinator(typeAST)
    }
    name = name || t.stringLiteral(getAssertArgumentName(id))
    return t.callExpression(
      assertId,
      [id, typeAST, name]
    )
  }
  function getAssert({ id, optional, annotation, name }, typeParameters) {
    return t.expressionStatement(getAssertCallExpression({ id, optional, annotation, name }, typeParameters))
  }

  function isObjectPattern(node) {
    return node.type === 'ObjectPattern'
  }

  function getParam(param, i) {
    if (param.type === 'AssignmentPattern' && param.left.typeAnnotation) {
      return getParam(param.left, i)
    }
    else if (param.typeAnnotation) {
      if (param.type === 'RestElement') {
        return {
          id: param.argument,
          optional: param.optional,
          annotation: param.typeAnnotation.typeAnnotation
        }
      }
      return {
        id: t.identifier(isObjectPattern(param) ? 'arguments[' + i + ']' : param.name),
        optional: param.optional,
        annotation: param.typeAnnotation.typeAnnotation
      }
    }
  }

  function getFunctionArgumentCheckExpressionsAST(node, typeParameters) {
    const params = node.params.map(getParam).filter(x => x)
    return params.map(param => getAssert(param, typeParameters))
  }

  function getParamNameAST(param) {
    if (param.type === 'AssignmentPattern') {
      return getParamNameAST(param.left)
    }
    else if (param.type === 'RestElement') {
      return t.restElement(param.argument)
    }
    else if (isObjectPattern(param)) {
      return param
    }
    return t.identifier(param.name)
  }

  function getWrappedFunctionReturnWithTypeCheckAST(node, typeParameters) {
    const params = node.params.map(getParamNameAST)
    const callParams = params.map(param => {
      if (isObjectPattern(param)) {
        return t.objectExpression(param.properties)
      }
      else if (param.type === 'RestElement') {
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
    if (param.type === 'GenericTypeAnnotation') {
      return param.id.name
    }
    return param.name
  }

  function getTypeParameters(node) {
    const typeParameters = {}
    if (node.typeParameters) {
      node.typeParameters.params.forEach(param => typeParameters[getTypeParameterName(param)] = param)
    }
    return typeParameters
  }

  function getTypeAliasDefinition(path) {
    const node = path.node
    const typeParameters = getTypeParameters(node)
    const isRecursive = isRecursiveType(node)
    const args = {
      annotation: node.right,
      typeParameters
    }

    if (isRecursive) {
      return [
        defineDeclareCombinator(node),
        t.callExpression(
          t.memberExpression(node.id, t.identifier('define')),
          [getType(args)]
        )
      ]
    }

    args.typeName = t.stringLiteral(node.id.name)
    return t.variableDeclaration('const', [
      t.variableDeclarator(node.id, getType(args))
    ])
  }

  function defineDeclareCombinator(node) {
    return t.variableDeclaration('const', [
      t.variableDeclarator(node.id, getDeclareCombinator(t.stringLiteral(node.id.name)))
    ])
  }

  function getInterfaceDefinitionAST(node, typeParameters) {
    const isRecursive = isRecursiveType(node)
    const args = {
      annotation: node.body,
      typeParameters
    }

    if (isRecursive) {
      return [
        defineDeclareCombinator(node),
        t.callExpression(
          t.memberExpression(node.id, t.identifier('define')),
          [getType(args)]
        )
      ]
    }

    args.typeName = t.stringLiteral(node.id.name)
    return t.variableDeclaration('const', [
      t.variableDeclarator(node.id, getType(args))
    ])
  }

  function getExtendedInterfaceDefinitionAST(node, typeParameters) {
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
      return [
        defineDeclareCombinator(node),
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
      ]
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
    return node.isRecursive || hasRecursiveComment(node)
  }

  function replaceTypeDefintion(path, definition) {
    if (Array.isArray(definition)) {
      if (path.parentPath.node.type === 'ExportNamedDeclaration') {
        path.parentPath.replaceWithMultiple([
          t.exportNamedDeclaration(definition[0], []),
          definition[1]
        ])
      }
      else {
        path.replaceWithMultiple(definition)
      }
    }
    else {
      path.replaceWith(definition)
    }
  }

  function isExternalImportDeclaration(source) {
    return path.normalize(source) === source
  }

  function getExternalImportDeclarationAST(path) {
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
            t.memberExpression(typesId, specifier.local),
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

  function getRuntimeTypeIntrospectionAST(node) {
    return node.typeAnnotation.typeAnnotation.typeParameters.params[0].id
  }

  function isTypeExportNamedDeclaration(node) {
    return node.declaration && ( node.declaration.type === 'TypeAlias' || node.declaration.type === 'InterfaceDeclaration' )
  }

  function getWrappedVariableDeclaratorInitWithTypeCheckAST(declarator, typeParameters) {
    return getAssertCallExpression({
      id: declarator.init,
      name: t.stringLiteral(declarator.id.name || generate(declarator.id, { concise: true }).code),
      annotation: declarator.id.typeAnnotation.typeAnnotation
    }, typeParameters)
  }

  function getWrappedAssignmentWithTypeCheckAST(node, typeAnnotation, typeParameters) {
    return getAssertCallExpression({
      id: node.right,
      name: t.stringLiteral(node.left.name || generate(node.left, { concise: true }).code),
      annotation: typeAnnotation
    }, typeParameters)
  }

  function findTypeAnnotationInObjectPattern(name, objectPattern, objectTypeAnnotation) {
    if (!objectTypeAnnotation || !t.isObjectTypeAnnotation(objectTypeAnnotation)) {
      return
    }

    for (let property of objectPattern.properties) {
      const typeAnnotation = find(objectTypeAnnotation.properties, propType => propType.key.name === property.key.name)
      if (!typeAnnotation) {
        continue
      }

      if (t.isIdentifier(property.value) && name === property.value.name) {
        return typeAnnotation.value
      } else if (t.isObjectPattern(property.value)) {
        const result = findTypeAnnotationInObjectPattern(name, property.value, typeAnnotation.value)
        if (result) {
          return result
        }
      } else if (t.isArrayPattern(property.value)) {
        const result = findTypeAnnotationInArrayPattern(name, property.value, typeAnnotation.value)
        if (result) {
          return result
        }
      }
    }
  }

  function findTypeAnnotationInArrayPattern(name, arrayPattern, arrayTypeAnnotation) {
    const isGenericArray = arrayTypeAnnotation && t.isGenericTypeAnnotation(arrayTypeAnnotation) && arrayTypeAnnotation.id.name === 'Array'
    if (!arrayTypeAnnotation || !(t.isTupleTypeAnnotation(arrayTypeAnnotation) || isGenericArray)) {
      return
    }

    for (let i = 0, element, length = arrayPattern.elements.length; i < length; i++) {
      element = arrayPattern.elements[i]
      const typeAnnotation = isGenericArray ? arrayTypeAnnotation.typeParameters.params[0] : arrayTypeAnnotation.types[i]
      if (!typeAnnotation) {
        continue
      }

      if (t.isIdentifier(element)) {
        return typeAnnotation
      } else if (t.isObjectPattern(element)) {
        const result = findTypeAnnotationInObjectPattern(name, element, typeAnnotation)
        if (result) {
          return result
        }
      } else if (t.isArrayPattern(element)) {
        const result = findTypeAnnotationInArrayPattern(name, element, typeAnnotation)
        if (result) {
          return result
        }
      }
    }
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
        },

        exit(path, state) {
          const isAssertTemplateRequired = hasAsserts && !state.opts[SKIP_ASSERTS_OPTION] && !state.opts[SKIP_HELPERS_OPTION]
          const isExtendTemplateRequired = hasExtend && !state.opts[SKIP_HELPERS_OPTION]
          const isImportTcombRequired = hasTypes || isAssertTemplateRequired || isExtendTemplateRequired

          if (isImportTcombRequired) {
            path.node.body.unshift(
              t.importDeclaration([t.importDefaultSpecifier(tcombId)], t.stringLiteral('tcomb'))
            )
          }

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
            path.replaceWithMultiple(getExternalImportDeclarationAST(path))
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
          node.declaration.isRecursive = isRecursiveType(node)
        }
      },

      TypeAlias(path) {
        preventReservedNamesUsage(path)
        hasTypes = true
        replaceTypeDefintion(path, getTypeAliasDefinition(path))
      },

      InterfaceDeclaration(path) {
        preventReservedNamesUsage(path)
        hasTypes = true
        const node = path.node
        const typeParameters = getTypeParameters(node)
        if (path.node.extends.length > 0) {
          hasExtend = true
          replaceTypeDefintion(path, getExtendedInterfaceDefinitionAST(node, typeParameters))
        }
        else {
          replaceTypeDefintion(path, getInterfaceDefinitionAST(node, typeParameters))
        }
      },

      TypeCastExpression(path, state) {
        const node = path.node
        if (isRuntimeTypeIntrospection(node)) {
          try {
            path.replaceWith(getRuntimeTypeIntrospectionAST(node))
          }
          catch (error) {
            buildCodeFrameError(path, new Error(`Invalid use of ${MAGIC_REIFY_NAME}`))
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
        const node = path.node
        const typeParameters = getTypeParameters(node)
        path.traverse({
          'Function|VariableDeclaration|AssignmentExpression'(path) {
            const node = path.node
            node._typeParameters = assign(typeParameters, node._typeParameters)
          }
        })
      },

      Function(path, state) {
        if (state.opts[SKIP_ASSERTS_OPTION]) {
          return
        }

        const node = path.node
        const typeParameters = assign(getTypeParameters(node), node._typeParameters)

        try {
          // Firstly let's replace arrow function expressions into
          // block statement return structures.
          if (node.type === 'ArrowFunctionExpression' && node.expression) {
            node.expression = false
            node.body = t.blockStatement([t.returnStatement(node.body)])
          }

          // If we have a return type then we will wrap our entire function
          // body and insert a type check on the returned value.
          if (node.returnType) {
            hasAsserts = true
            path.get('body').replaceWithMultiple(getWrappedFunctionReturnWithTypeCheckAST(node, typeParameters))
          }

          // Prepend any argument checks to the top of our function body.
          const argumentChecks = getFunctionArgumentCheckExpressionsAST(node, typeParameters)
          if (argumentChecks.length > 0) {
            hasAsserts = true
            node.body.body.unshift(...argumentChecks)
          }
        }
        catch (error) {
          buildCodeFrameError(path, error)
        }
      },

      VariableDeclaration(path, state) {
        if (state.opts[SKIP_ASSERTS_OPTION]) {
          return
        }

        const node = path.node
        try {
          node.declarations.forEach(declarator => {
            const id = declarator.id

            const typeAnnotation = id.typeAnnotation && id.typeAnnotation.typeAnnotation
            id.savedTypeAnnotation = typeAnnotation

            if (!declarator.init || !id.savedTypeAnnotation) {
              return
            }

            hasAsserts = true
            const typeParameters = node._typeParameters
            declarator.init = getWrappedVariableDeclaratorInitWithTypeCheckAST(declarator, typeParameters)
          })
        }
        catch (error) {
          buildCodeFrameError(path, error)
        }
      },

      AssignmentExpression(path, state) {
        if (state.opts[SKIP_ASSERTS_OPTION]) {
          return
        }

        const { node, scope } = path

        try {
          let typeAnnotation
          if (t.isIdentifier(node.left)) {
            const name = node.left.name
            const binding = scope.getBinding(name)
            if (!binding || binding.path.type !== 'VariableDeclarator') {
              return
            }

            const declaratorId = binding.path.node.id
            typeAnnotation = declaratorId.savedTypeAnnotation

            if (t.isObjectPattern(declaratorId)) {
              typeAnnotation = findTypeAnnotationInObjectPattern(name, declaratorId, typeAnnotation)
            } else if (t.isArrayPattern(declaratorId)) {
              typeAnnotation = findTypeAnnotationInArrayPattern(name, declaratorId, typeAnnotation)
            }
          }

          if (!typeAnnotation || typeAnnotation.type === 'AnyTypeAnnotation') {
            return
          }

          const typeParameters = node._typeParameters
          hasAsserts = true
          node.right = getWrappedAssignmentWithTypeCheckAST(node, typeAnnotation, typeParameters)
        }
        catch (error) {
          buildCodeFrameError(path, error)
        }
      }
    }
  }
}
