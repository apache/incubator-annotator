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

import type { TextPositionSelector } from '@annotator/selector';
import { ownerDocument } from '../owner-document';
import { Chunk, Chunker, ChunkRange, TextNodeChunker } from '../chunker';
import { CodePointSeeker } from '../code-point-seeker';
import { TextSeeker } from '../seek';

export async function describeTextPosition(
  range: Range,
  maybeScope?: Range,
): Promise<TextPositionSelector> {
  // Default to search in the whole document.
  let scope: Range;
  if (maybeScope !== undefined) {
    scope = maybeScope;
  } else {
    const document = ownerDocument(range);
    scope = document.createRange();
    scope.selectNodeContents(document);
  }

  const textChunks = new TextNodeChunker(scope);
  if (textChunks.currentChunk === null)
    throw new RangeError('Range does not contain any Text nodes.');

  return await abstractDescribeTextPosition(
    textChunks.rangeToChunkRange(range),
    textChunks,
  );
}

async function abstractDescribeTextPosition<TChunk extends Chunk<string>>(
  target: ChunkRange<TChunk>,
  scope: Chunker<TChunk>,
): Promise<TextPositionSelector> {
  const codeUnitSeeker = new TextSeeker(scope);
  const codePointSeeker = new CodePointSeeker(codeUnitSeeker);

  codePointSeeker.seekToChunk(target.startChunk, target.startIndex);
  const start = codePointSeeker.position;
  codePointSeeker.seekToChunk(target.endChunk, target.endIndex);
  const end = codePointSeeker.position;
  return {
    type: 'TextPositionSelector',
    start,
    end,
  };
}
