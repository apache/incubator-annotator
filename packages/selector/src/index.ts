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

export function withRefinement<
  TSelector,
  TSelectorScope,
  TRefinement,
  TRefinementScope,
  TMatch
>(
  createMatcher: (
    selector: TSelector,
  ) => (scope: TSelectorScope) => AsyncIterable<TRefinementScope>,
  createRefiner: (
    selector: TRefinement,
  ) => (scope: TRefinementScope) => AsyncIterable<TMatch>,
): (
  selector: TSelector & { refinedBy?: TRefinement },
) => (scope: TSelectorScope) => AsyncIterable<TRefinementScope | TMatch> {
  return function createMatcherWithRefinement(selector) {
    const { refinedBy } = selector;

    if (refinedBy) {
      const match = createMatcher(selector);
      const refine = createRefiner(refinedBy);

      return async function* matchAll(scope) {
        for await (const subScope of match(scope)) {
          yield* refine(subScope);
        }
      };
    }

    return createMatcher(selector);
  };
}

export function withRecursiveRefinement<TSelector, TScope>(
  createMatcher: (
    selector: TSelector & { refinedBy?: TSelector },
  ) => (scope: TScope) => AsyncIterable<TScope>,
): (
  selector: TSelector & { refinedBy?: TSelector },
) => (scope: TScope) => AsyncIterable<TScope> {
  return withRefinement(createMatcher, createMatcher);
}
