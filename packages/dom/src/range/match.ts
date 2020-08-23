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

import { product } from './cartesian';

export interface RangeSelector<T> {
  startSelector: T;
  endSelector: T;
}

export function makeCreateRangeSelectorMatcher<T>(
  createMatcher: (selector: T) => (scope: Range) => AsyncIterable<Range>,
): (selector: RangeSelector<T>) => (scope: Range) => AsyncIterable<Range> {
  return function createRangeSelectorMatcher(selector) {
    const startMatcher = createMatcher(selector.startSelector);
    const endMatcher = createMatcher(selector.endSelector);

    return async function* matchAll(scope: Range) {
      const { commonAncestorContainer } = scope;
      const document =
        commonAncestorContainer.ownerDocument ??
        (commonAncestorContainer as Document);

      const startMatches = startMatcher(scope);
      const endMatches = endMatcher(scope);

      const pairs = product(startMatches, endMatches);

      for await (const [start, end] of pairs) {
        const result = document.createRange();

        result.setStart(start.endContainer, start.endOffset);
        result.setEnd(end.startContainer, end.startOffset);

        if (!result.collapsed) yield result;
      }
    };
  };
}
