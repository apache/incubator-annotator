/** 
 * SPDX-FileCopyrightText: 2016-2020 The Apache Software Foundation
 * SPDX-License-Identifier: Apache-2.0
 * @license
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { assert } from 'chai';

// RangeInfo serialises a Range’s start and end containers as XPaths.
export type RangeInfo = {
  startContainerXPath: string;
  startOffset: number;
  endContainerXPath: string;
  endOffset: number;
};

export function evaluateXPath(doc: Document, xpath: string): Node {
  const result = doc.evaluate(
    xpath,
    doc,
    null,
    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
  );
  const nodes = new Array(result.snapshotLength)
    .fill(undefined)
    .map((_, i) => result.snapshotItem(i));
  assert.equal(
    nodes.length,
    1,
    `Test suite contains XPath with ${nodes.length} results instead of 1: '${xpath}'`,
  );
  return nodes[0] as Node;
}

export function hydrateRange(rangeInfo: RangeInfo, doc: Document): Range {
  const range = doc.createRange();
  range.setStart(
    evaluateXPath(doc, rangeInfo.startContainerXPath),
    rangeInfo.startOffset,
  );
  range.setEnd(
    evaluateXPath(doc, rangeInfo.endContainerXPath),
    rangeInfo.endOffset,
  );
  return range;
}
