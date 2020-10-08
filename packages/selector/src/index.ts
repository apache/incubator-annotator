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

import type { Matcher, Selector } from './types';

export type { Matcher, Selector } from './types';
export type { CssSelector, RangeSelector, TextPositionSelector, TextQuoteSelector } from './types';

export function makeRefinable<
  // Any subtype of Selector can be made refinable; but note we limit the value
  // of refinedBy because it must also be accepted by matcherCreator.
  TSelector extends Selector & { refinedBy: TSelector },
  TScope,
  // To enable refinement, the implementation’s Match object must be usable as a
  // Scope object itself.
  TMatch extends TScope
>(
  matcherCreator: (selector: TSelector) => Matcher<TScope, TMatch>,
): (selector: TSelector) => Matcher<TScope, TMatch> {
  return function createMatcherWithRefinement(
    sourceSelector: TSelector,
  ): Matcher<TScope, TMatch> {
    const matcher = matcherCreator(sourceSelector);

    if (sourceSelector.refinedBy) {
      const refiningSelector = createMatcherWithRefinement(
        sourceSelector.refinedBy,
      );

      return async function* matchAll(scope) {
        for await (const match of matcher(scope)) {
          yield* refiningSelector(match);
        }
      };
    }

    return matcher;
  };
}
