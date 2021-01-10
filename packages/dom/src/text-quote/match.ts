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

import type { Matcher, TextQuoteSelector } from '@apache-annotator/selector';
import { textQuoteSelectorMatcher as abstractTextQuoteSelectorMatcher } from '@apache-annotator/selector';
import { TextNodeChunker, EmptyScopeError } from '../text-node-chunker';

export function createTextQuoteSelectorMatcher(
  selector: TextQuoteSelector,
): Matcher<Range, Range> {
  const abstractMatcher = abstractTextQuoteSelectorMatcher(selector);

  return async function* matchAll(scope) {
    let textChunks;
    try {
      textChunks = new TextNodeChunker(scope);
    } catch (err) {
      if (err instanceof EmptyScopeError) return;
      // An empty range contains no matches.
      else throw err;
    }

    for await (const abstractMatch of abstractMatcher(textChunks)) {
      yield textChunks.chunkRangeToRange(abstractMatch);
    }
  };
}
