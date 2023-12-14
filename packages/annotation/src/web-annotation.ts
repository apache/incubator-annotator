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

import type {
  OneOrMore,
  OneOrMoreIncluding,
  ZeroOrMore,
} from './multiplicity.js';

/**
 * A Web Annotation object.
 *
 * This is an interpretation of the Web Annotation Data Model:
 * <https://www.w3.org/TR/2017/REC-annotation-model-20170223/>
 *
 * TODO Deal more systemically with ‘relations’, i.e. values that could be
 * either a nested object or a URI referring to such an object.
 */
export interface WebAnnotation {
  '@context': OneOrMoreIncluding<string, 'http://www.w3.org/ns/anno.jsonld'>;
  type: OneOrMoreIncluding<string, 'Annotation'>;
  id: string;
  target: OneOrMore<Target>;
  creator?: ZeroOrMore<Agent>;
  created?: UtcDateTime;
  generator?: ZeroOrMore<Agent>;
  generated?: UtcDateTime;
  modified?: UtcDateTime;
  motivation?: ZeroOrMore<Motivation>;
  audience?: ZeroOrMore<Audience>;
  rights?: ZeroOrMore<string>;
  canonical?: string;
  via?: ZeroOrMore<string>;
  body?: BodyChoice | OneOrMore<Body>;
  bodyValue?: string;
}

/**
 * A slightly stricter type for WebAnnotation, not allowing both a body and bodyValue.
 */
export type WebAnnotationStrict = WebAnnotation & (WithBody | WithBodyValue | WithoutBody);

interface WithBody {
  body: BodyChoice | OneOrMore<Body>;
  bodyValue?: undefined;
}

interface WithBodyValue {
  body?: undefined;
  bodyValue: string;
}

interface WithoutBody {
  body?: undefined;
  bodyValue?: undefined;
}

export type Body = string | BodyObject;

export type BodyObject = {
  creator?: ZeroOrMore<Agent>;
  created?: UtcDateTime;
  modified?: UtcDateTime;
  purpose?: ZeroOrMore<Motivation>;
} & (TextualBody | SpecificResource | ExternalResource);

export type Target = string | SpecificResource | ExternalResource;

export type Agent =
  | string
  | {
      id?: string;
      type?: ZeroOrMore<'Person' | 'Organization' | 'Software'>;
      name?: ZeroOrMore<string>;
      nickname?: ZeroOrMore<string>;
      email?: ZeroOrMore<string>;
      email_sha1?: ZeroOrMore<string>;
      homepage?: ZeroOrMore<string>;
    };

export type Audience =
  | string
  | {
      id?: string;
      type?: string;
    };

export interface BodyChoice {
  type: 'Choice';
  items: Body[];
}

export interface TextualBody extends Omit<ExternalResource, 'id' | 'type'> {
  id?: string;
  type: 'TextualBody';
  value: string;
}

export interface SpecificResource {
  id?: string;
  type?: 'SpecificResource';
  source: string;
  selector?: string | OneOrMore<Selector>;
  accessibility?: AccessibilityFeatures;
  rights?: ZeroOrMore<string>;
  canonical?: string;
  via?: ZeroOrMore<string>;
}

/**
 * A {@link https://www.w3.org/TR/2017/REC-annotation-model-20170223/#selectors
 * | Selector} object of the Web Annotation Data Model.
 *
 * Corresponds to RDF class {@link http://www.w3.org/ns/oa#Selector}
 *
 * @public
 */
export interface Selector {
  type?: string;

  /**
   * A Selector can be refined by another Selector.
   *
   * See {@link https://www.w3.org/TR/2017/REC-annotation-model-20170223/#refinement-of-selection
   * | §4.2.9 Refinement of Selection} in the Web Annotation Data Model.
   *
   * Corresponds to RDF property {@link http://www.w3.org/ns/oa#refinedBy}
   */
  refinedBy?: Selector;
}

export interface ExternalResource {
  id: string;
  // XXX type’s value SHOULD be one of these, “but MAY come from other vocabularies”.
  type?: ZeroOrMore<'Dataset' | 'Image' | 'Video' | 'Sound' | 'Text'>;
  format?: ZeroOrMore<string>;
  language?: ZeroOrMore<string>;
  processingLanguage?: string;
  textDirection?: 'ltr' | 'rtl' | 'auto';
  accessibility?: AccessibilityFeatures;
  rights?: ZeroOrMore<string>;
  canonical?: string;
  via?: ZeroOrMore<string>;
}

export type Motivation =
  | 'assessing'
  | 'bookmarking'
  | 'classifying'
  | 'commenting'
  | 'describing'
  | 'editing'
  | 'highlighting'
  | 'identifying'
  | 'linking'
  | 'moderating'
  | 'questioning'
  | 'replying'
  | 'tagging';

// “The datetime MUST be a xsd:dateTime with the UTC timezone expressed as "Z".”
type UtcDateTime = `${string}Z`;

// To help usage, narrow the type of Date.toISOString(); it is guaranteed to end with a 'Z'.
declare global {
  interface Date {
    toISOString(): UtcDateTime;
  }
}

// From <https://www.w3.org/2021/a11y-discov-vocab/latest/CG-FINAL-a11y-discov-vocab-20220610.html>
export type AccessibilityFeatures =
  | ZeroOrMore<AccessibilityFeature>
  | 'none'
  | ['none'];
export type AccessibilityFeature =
  | 'annotations'
  | 'ARIA'
  | 'bookmarks'
  | 'index'
  | 'printPageNumbers'
  | 'readingOrder'
  | 'structuralNavigation'
  | 'tableOfContents'
  | 'taggedPDF'
  | 'alternativeText'
  | 'audioDescription'
  | 'captions'
  | 'describedMath'
  | 'longDescription'
  | 'rubyAnnotations'
  | 'signLanguage'
  | 'transcript'
  | 'displayTransformability'
  | 'synchronizedAudioText'
  | 'timingControl'
  | 'unlocked'
  | 'ChemML'
  | 'latex'
  | 'MathML'
  | 'ttsMarkup'
  | 'highContrastAudio'
  | 'highContrastDisplay'
  | 'largePrint'
  | 'braille'
  | 'tactileGraphic'
  | 'tactileObject';
