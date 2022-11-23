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

import type { Selector } from '@apache-annotator/annotation';
export type { Selector };

/**
 * The {@link https://www.w3.org/TR/2017/REC-annotation-model-20170223/#css-selector
 * | CssSelector} of the Web Annotation Data Model.
 *
 * Corresponds to RDF class {@link http://www.w3.org/ns/oa#CssSelector}
 *
 * @public
 */
export interface CssSelector extends Selector {
  type: 'CssSelector';
  value: string;
}

/**
 * The {@link https://www.w3.org/TR/2017/REC-annotation-model-20170223/#text-quote-selector
 * | TextQuoteSelector} of the Web Annotation Data Model.
 *
 * Corresponds to RDF class {@link http://www.w3.org/ns/oa#TextQuoteSelector}
 *
 * @public
 */
export interface TextQuoteSelector extends Selector {
  type: 'TextQuoteSelector';
  exact: string;
  prefix?: string;
  suffix?: string;
}

/**
 * The {@link https://www.w3.org/TR/2017/REC-annotation-model-20170223/#text-position-selector
 * | TextPositionSelector} of the Web Annotation Data Model.
 *
 * Corresponds to RDF class {@link http://www.w3.org/ns/oa#TextPositionSelector}
 *
 * @public
 */
export interface TextPositionSelector extends Selector {
  type: 'TextPositionSelector';
  start: number; // more precisely: non-negative integer
  end: number; // more precisely: non-negative integer
}

/**
 * The {@link https://www.w3.org/TR/2017/REC-annotation-model-20170223/#range-selector
 * | RangeSelector} of the Web Annotation Data Model.
 *
 * Corresponds to RDF class {@link http://www.w3.org/ns/oa#RangeSelector}
 *
 * @public
 */
export interface RangeSelector extends Selector {
  type: 'RangeSelector';
  startSelector: Selector;
  endSelector: Selector;
}

/**
 * A function that finds the match(es) in the given (sub)document (the ‘scope’)
 * corresponding to some (prespecified) selector(s).
 *
 * @public
 */
export interface Matcher<TScope, TMatch> {
  (scope: TScope): AsyncGenerator<TMatch, void, void>;
}
