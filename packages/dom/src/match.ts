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
 *
 * SPDX-FileCopyrightText: The Apache Software Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

import { asArray, OneOrMore } from "@apache-annotator/annotation";
import type {
  CssSelector,
  TextQuoteSelector,
  TextPositionSelector,
  RangeSelector,
  Matcher,
  Refinable,
} from "@apache-annotator/selector";
import { makeRefinable } from "@apache-annotator/selector";
import { createCssSelectorMatcher } from "./css";
import { makeCreateRangeSelectorMatcher } from "./range";
import { createTextPositionSelectorMatcher } from "./text-position";
import { createTextQuoteSelectorMatcher } from "./text-quote";

export const supportedSelectorTypes = [
  "CssSelector",
  "TextQuoteSelector",
  "TextPositionSelector",
  "RangeSelector",
];

export type SupportedSelector = Refinable<
  | CssSelector
  | TextQuoteSelector
  | TextPositionSelector
  | RangeSelector<SupportedSelector>
>;

export type DomScope = Node | Range;
export type DomMatch = Element | Range;
export type DomMatcher = Matcher<DomScope, DomMatch>;

const createMatcher: (
  selector: SupportedSelector
) => DomMatcher = makeRefinable<SupportedSelector, DomScope, DomMatch>(
  (selector: SupportedSelector) => {
    if (selector.type === "CssSelector")
      return createCssSelectorMatcher(selector);
    if (selector.type === "TextQuoteSelector")
      return createTextQuoteSelectorMatcher(selector);
    if (selector.type === "TextPositionSelector")
      return createTextPositionSelectorMatcher(selector);
    if (selector.type === "RangeSelector")
      return makeCreateRangeSelectorMatcher(
        // @ts-ignore (needless type error; bug in TypeScript?)
        createMatcher
      )(selector);
    throw new Error(`Unsupported selector type: ${(selector as any)?.type}`);
  }
);

export function createAnySelectorMatcher(
  oneOrMoreSelectors: OneOrMore<SupportedSelector>
): DomMatcher {
  const selectors = asArray(oneOrMoreSelectors);
  // Use the first selector we understand. (“Multiple Selectors SHOULD select the same content”)
  // TODO Take the more precise one; retry with others if the first fails; perhaps combine e.g. Position+Quote for speedup.
  const selector = selectors.find(
    (selector) =>
    selector.type && supportedSelectorTypes.includes(selector.type)
  );
  if (!selector) throw new Error(`Unsupported selector type: ${asArray(selectors).map(s => s.type)}`);
  const matcher = createMatcher(selector as SupportedSelector)
  return matcher;
}

export async function matchSelector(
  selectors: OneOrMore<SupportedSelector>,
  scope: DomScope = window.document
) {
  const matchGenerator = createAnySelectorMatcher(selectors)(scope);
  const matches: DomMatch[] = [];
  for await (const match of matchGenerator) {
    matches.push(match);
  }
  return matches;
}
