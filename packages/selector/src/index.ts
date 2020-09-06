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

type Selector = { type: string };

type Matcher<TScope, TMatch> = (scope: TScope) => AsyncIterable<TMatch>;
type MatcherCreator<TSelector extends Selector, TScope, TMatch> = (
  selector: TSelector,
) => Matcher<TScope, TMatch>;

type Plugin<TSelector extends Selector, TScope, TMatch> = (
  next: MatcherCreator<TSelector, TScope, TMatch>,
  recurse: MatcherCreator<TSelector, TScope, TMatch>,
) => MatcherCreator<TSelector, TScope, TMatch>;

export function composeMatcherCreator<
  TSelector extends Selector,
  TScope,
  TMatch extends TScope
>(
  ...plugins: Array<Plugin<TSelector, TScope, TMatch>>
): MatcherCreator<TSelector, TScope, TMatch> {
  function innerMatcherCreator(selector: TSelector): Matcher<TScope, TMatch> {
    throw new TypeError(`Unhandled selector. Selector type: ${selector.type}`);
  }

  function outerMatcherCreator(selector: TSelector): Matcher<TScope, TMatch> {
    return composedMatcherCreator(selector);
  }

  const composedMatcherCreator = plugins.reduceRight(
    (matcherCreator, plugin) => plugin(matcherCreator, outerMatcherCreator),
    innerMatcherCreator,
  );

  return outerMatcherCreator;
}

type MatcherCreatorMap<TSelector extends Selector, TScope, TMatch> = {
  [K: string]: MatcherCreator<TSelector, TScope, TMatch>;
};

export function mapSelectorTypes<TSelector extends Selector, TScope, TMatch>(
  matcherCreators: MatcherCreatorMap<TSelector, TScope, TMatch>,
): Plugin<TSelector, TScope, TMatch> {
  return function mapSelectorTypesPlugin(next) {
    return function (selector) {
      const matcherCreator = matcherCreators[selector.type];

      if (matcherCreator) {
        return matcherCreator(selector);
      }

      return next(selector);
    };
  };
}

export function withRefinement<
  TSelector extends Selector & { refinedBy?: TSelector },
  TScope,
  TMatch
>(
  next: (selector: TSelector) => (scope: TScope) => AsyncIterable<TScope>,
  recurse: (selector: TSelector) => (scope: TScope) => AsyncIterable<TMatch>,
): MatcherCreator<TSelector, TScope, TMatch> {
  return function createMatcherWithRefinement(selector) {
    const { refinedBy } = selector;
    const matcher = next(selector);

    if (refinedBy) {
      const refine = recurse(refinedBy);

      return async function* matchAll(scope) {
        for await (const subScope of matcher(scope)) {
          yield* refine(subScope);
        }
      };
    }

    return matcher;
  };
}
