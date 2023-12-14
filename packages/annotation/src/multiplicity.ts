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

export type OneOrMore<T> = T | T[];
export type ZeroOrMore<T> = undefined | null | T | T[];

export type OneOrMoreIncluding<Other extends any, RequiredValue extends any> =
  | RequiredValue
  | [RequiredValue, ...Other[]]
  | [...Other[], RequiredValue];
// | [Other, ...OneOrMoreIncluding<Other, RequiredValue>]; // FIXME TypeScript complains about the circular reference..

/**
 * OnlyOne<T> extracts the T from a One/ZeroOrMore<T> type
 */
export type OnlyOne<T> = T extends (infer X)[] ? X : T;

export function asArray<T>(value: ZeroOrMore<T>): T[] {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null) return [];
  return [value];
}

export function asSingleValue<T>(value: ZeroOrMore<T>): T | undefined {
  if (value instanceof Array) return value[0];
  if (value === undefined || value === null) return undefined;
  return value;
}
