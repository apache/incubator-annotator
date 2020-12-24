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

import type { TextPositionSelector } from '../types';
import type { Chunk, ChunkRange, Chunker } from './chunker';
import { CodePointSeeker } from './code-point-seeker';
import { TextSeeker } from './seeker';

export function textPositionSelectorMatcher(
  selector: TextPositionSelector,
): <TChunk extends Chunk<any>>(
  scope: Chunker<TChunk>,
) => AsyncGenerator<ChunkRange<TChunk>, void, void> {
  const { start, end } = selector;

  return async function* matchAll<TChunk extends Chunk<string>>(
    textChunks: Chunker<TChunk>,
  ) {
    const codeUnitSeeker = new TextSeeker(textChunks);
    const codePointSeeker = new CodePointSeeker(codeUnitSeeker);

    codePointSeeker.seekTo(start);
    const startChunk = codeUnitSeeker.currentChunk;
    const startIndex = codeUnitSeeker.offsetInChunk;
    codePointSeeker.seekTo(end);
    const endChunk = codeUnitSeeker.currentChunk;
    const endIndex = codeUnitSeeker.offsetInChunk;

    yield { startChunk, startIndex, endChunk, endIndex };
  };
}
