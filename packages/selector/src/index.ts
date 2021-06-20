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

import type { Matcher, Selector, SelectorType, MatcherCreator, Plugin } from './types';

export * from './text';
export * from './types';

interface TypeToMatcherCreatorMap<TScope, TMatch> {
  // [K: SelectorType]: MatcherCreator<TScope, TMatch>; // Gives errors further down. TypeScript’s fault?
  [K: string]: MatcherCreator<TScope, TMatch> | undefined;
}

export function composeMatcherCreator<TScope, TMatch extends TScope>(
  ...plugins: Array<Plugin<TScope, TMatch>>
): MatcherCreator<TScope, TMatch> {
  function innerMatcherCreator(selector: Selector): Matcher<TScope, TMatch> {
    throw new TypeError(`Unhandled selector. Selector type: ${selector.type}`);
  }

  function outerMatcherCreator(selector: Selector): Matcher<TScope, TMatch> {
    return composedMatcherCreator(selector);
  }

  const composedMatcherCreator = plugins.reduceRight(
    (
      matcherCreator: MatcherCreator<TScope, TMatch>,
      plugin: Plugin<TScope, TMatch>
    ) => plugin(matcherCreator, outerMatcherCreator),
    innerMatcherCreator,
  );

  return outerMatcherCreator;
}

// A plugin with parameters (i.e. a function that returns a plugin)
// Invokes the matcher implementation corresponding to the selector’s type.
export function mapSelectorTypes<TScope, TMatch extends TScope>(
  typeToMatcherCreator: TypeToMatcherCreatorMap<TScope, TMatch>,
): Plugin<TScope, TMatch> {
  return function mapSelectorTypesPlugin(next, recurse): MatcherCreator<TScope, TMatch> {
    return function(selector: Selector): Matcher<TScope, TMatch> {
      const type = selector.type;
      if (type !== undefined) {
        const matcherCreator = typeToMatcherCreator[type];
        if (matcherCreator !== undefined)
          return matcherCreator(selector);
      }
      // Not a know selector type; continue down the plugin chain.
      return next(selector);
    }
  }
}

/**
 * A plugin to support the Selector’s refinedBy field.
 *
 * See {@link https://www.w3.org/TR/2017/REC-annotation-model-20170223/#refinement-of-selection
 * | §4.2.9 Refinement of Selection} in the Web Annotation Data Model.
 *
 * @public
 */
export const supportRefinement: Plugin<any, any> =
  function supportRefinementPlugin<TScope, TMatch extends TScope>(
    next: MatcherCreator<TScope, TMatch>,
    recurse: MatcherCreator<TScope, TMatch>,
  ) {
  return function createMatcherWithRefinement(
    sourceSelector: Selector,
  ): Matcher<TScope, TMatch> {
    const matcher = next(sourceSelector);

    if (sourceSelector.refinedBy) {
      const refiningSelector = recurse(
        sourceSelector.refinedBy,
      );

      return async function* matchAll(scope) {
        for await (const match of matcher(scope)) {
          yield* refiningSelector(match);
        }
      };
    } else {
      return matcher;
    }
  };
}
