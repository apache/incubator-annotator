/**
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

import type { TextPositionSelector } from '@apache-annotator/selector';
import { describeTextPosition as abstractDescribeTextPosition } from '@apache-annotator/selector';
import { ownerDocument } from '../owner-document';
import { TextNodeChunker } from '../text-node-chunker';

/**
 * Returns a {@link @apache-annotator/selector#TextPositionSelector} that points
 * at the target text within the given scope.
 *
 * When no scope is given, the position is described relative to the document
 * as a whole. Note this means all the characters in all Text nodes are counted
 * to determine the target’s position, including those in the `<head>` and
 * whitespace, hence even a minor modification could make the selector point to
 * a different text than its original target.
 *
 * @example
 * ```
 * const target = window.getSelection().getRangeAt(0);
 * const selector = await describeTextPosition(target);
 * console.log(selector);
 * // {
 * //   type: 'TextPositionSelector',
 * //   start: 702,
 * //   end: 736
 * // }
 * ```
 *
 * @param range - The range of characters that the selector should describe
 * @param maybeScope - A {@link https://developer.mozilla.org/en-US/docs/Web/API/Range
 * | Range} that serves as the ‘document’ for purposes of finding occurrences
 * and determining prefix and suffix. Defaults to span the full Document
 * containing the range.
 * @returns The selector describing the `range` relative to `scope`
 *
 * @public
 */
export async function describeTextPosition(
  range: Range,
  maybeScope?: Range,
): Promise<TextPositionSelector> {
  // Default to search in the whole document.
  let scope: Range;
  if (maybeScope !== undefined) {
    scope = maybeScope;
  } else {
    const document = ownerDocument(range);
    scope = document.createRange();
    scope.selectNodeContents(document);
  }

  const textChunks = new TextNodeChunker(scope);
  if (textChunks.currentChunk === null)
    throw new RangeError('Range does not contain any Text nodes.');

  return await abstractDescribeTextPosition(
    textChunks.rangeToChunkRange(range),
    textChunks,
  );
}
