import { assert } from "chai";

// RangeInfo serialises a Range’s start and end containers as XPaths.
export type RangeInfo = {
  startContainerXPath: string,
  startOffset: number,
  endContainerXPath: string,
  endOffset: number,
};

export function evaluateXPath(doc: Document, xpath: string): Node {
  const result = doc.evaluate(xpath, doc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE);
  const nodes = new Array(result.snapshotLength).fill(undefined).map((_, i) => result.snapshotItem(i));
  assert.equal(nodes.length, 1,
    `Test suite contains XPath with ${nodes.length} results instead of 1: '${xpath}'`
  );
  return nodes[0];
}

export function hydrateRange(rangeInfo: RangeInfo, doc: Document): Range {
  const range = doc.createRange();
  range.setStart(evaluateXPath(doc, rangeInfo.startContainerXPath), rangeInfo.startOffset);
  range.setEnd(evaluateXPath(doc, rangeInfo.endContainerXPath), rangeInfo.endOffset);
  return range;
}
