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

export interface Selector {
  refinedBy?: Selector;
}

export function makeRefinable<T>(
  createMatcher: (selector: Selector) => (scope: T) => AsyncIterable<T>,
): (selector: Selector) => (scope: T) => AsyncIterable<T> {
  return function createMatcherWithRefinement(selector) {
    const { refinedBy } = selector;

    if (refinedBy) {
      const subScopes = createMatcher(selector);
      const refinement = createMatcherWithRefinement(refinedBy) as (
        scope: T,
      ) => AsyncIterable<T>;

      return async function* matchAll(scope) {
        for await (const subScope of subScopes(scope)) {
          yield* refinement(subScope);
        }
      };
    }

    return createMatcher(selector);
  };
}
