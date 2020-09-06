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

import type { RangeSelector } from './selector';
import { makeCreateRangeSelectorMatcher } from './match';

export * from './match';
export * from './selector';

export function withRange<T>(
  createMatcher: (selector: T) => (scope: Range) => AsyncIterable<Range>,
): (selector: T | RangeSelector<T>) => (scope: Range) => AsyncIterable<Range> {
  const createRangeMatcher = makeCreateRangeSelectorMatcher(createMatcher);
  return function createMatcherWithRange(selector) {
    if ('type' in selector && selector.type === 'RangeSelector') {
      return createRangeMatcher(selector);
    }
    return createMatcher(selector as T);
  };
}

export function withRangeRecursive<T>(
  createMatcher: (selector: T) => (scope: Range) => AsyncIterable<Range>,
): (selector: T | RangeSelector<T>) => (scope: Range) => AsyncIterable<Range> {
  const inner = withRange(createMatcher);
  return withRange(inner);
}
