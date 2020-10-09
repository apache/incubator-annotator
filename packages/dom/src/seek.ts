const E_END = 'Iterator exhausted before seek ended.'
const E_SHOW = 'Argument 1 of seek must use filter NodeFilter.SHOW_TEXT.'
const E_WHERE = 'Argument 2 of seek must be an integer or a Text Node.'

const DOCUMENT_POSITION_PRECEDING = 2
const SHOW_TEXT = 4
const TEXT_NODE = 3


export default function seek(iter: NodeIterator, where: number | Text): number {
  if (iter.whatToShow !== SHOW_TEXT) {
    let error

    // istanbul ignore next
    try {
      error = new DOMException(E_SHOW, 'InvalidStateError')
    } catch {
      error = new Error(E_SHOW);
      error.code = 11
      error.name = 'InvalidStateError'
      error.toString = () => `InvalidStateError: ${E_SHOW}`
    }

    throw error
  }

  let count = 0
  let node = iter.referenceNode
  let predicates = null

  if (isInteger(where)) {
    predicates = {
      forward: () => count < where,
      backward: () => count > where || !iter.pointerBeforeReferenceNode,
    }
  } else if (isText(where)) {
    let forward = before(node, where) ? () => false : () => node !== where
    let backward = () => node !== where || !iter.pointerBeforeReferenceNode
    predicates = {forward, backward}
  } else {
    throw new TypeError(E_WHERE)
  }

  while (predicates.forward()) {
    node = iter.nextNode()

    if (node === null) {
      throw new RangeError(E_END)
    }

    count += node.nodeValue.length
  }

  if (iter.nextNode()) {
    node = iter.previousNode()
  }

  while (predicates.backward()) {
    node = iter.previousNode()

    if (node === null) {
      throw new RangeError(E_END)
    }

    count -= node.nodeValue.length
  }

  if (!isText(iter.referenceNode)) {
    throw new RangeError(E_END);
  }

  return count
}


function isInteger(n) {
  if (typeof n !== 'number') return false;
  return isFinite(n) && Math.floor(n) === n;
}


function isText(node) {
  return node.nodeType === TEXT_NODE
}


function before(ref, node) {
  return ref.compareDocumentPosition(node) & DOCUMENT_POSITION_PRECEDING
}
