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

import type { TextQuoteSelector } from '@annotator/selector';
import { describeTextQuote as abstractDescribeTextQuote } from '@annotator/selector';
import { ownerDocument } from '../owner-document';
import { TextNodeChunker } from '../text-node-chunker';

export async function describeTextQuote(
  range: Range,
  maybeScope?: Range,
): Promise<TextQuoteSelector> {
  // Default to search in the whole document.
  let scope: Range;
  if (maybeScope !== undefined) {
    scope = maybeScope;
  } else {
    const document = ownerDocument(range);
    scope = document.createRange();
    scope.selectNodeContents(document);
  }

  const chunker = new TextNodeChunker(scope);

  return await abstractDescribeTextQuote(
    chunker.rangeToChunkRange(range),
    () => new TextNodeChunker(scope),
  );
}
