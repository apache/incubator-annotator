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

import type { Matcher, TextQuoteSelector } from '@annotator/selector';
import { TextNodeChunker, Chunk, Chunker } from '../chunker';

export interface ChunkRange<TChunk extends Chunk<any>> {
  startChunk: TChunk;
  startIndex: number;
  endChunk: TChunk;
  endIndex: number;
}

export function createTextQuoteSelectorMatcher(
  selector: TextQuoteSelector,
): Matcher<Range, Range> {
  const abstractMatcher = abstractTextQuoteSelectorMatcher(selector);
  return async function* matchAll(scope) {
    const textChunks = new TextNodeChunker(scope);

    for await (const abstractMatch of abstractMatcher(textChunks)) {
      const match = document.createRange();
      // The `+…startOffset` parts are only relevant for the first chunk, as it
      // might start within a text node.
      match.setStart(abstractMatch.startChunk.node,
        abstractMatch.startIndex + abstractMatch.startChunk.startOffset);
      match.setEnd(abstractMatch.endChunk.node,
        abstractMatch.endIndex + abstractMatch.endChunk.startOffset);
      yield match;
    }
  }
}

type AbstractMatcher<TChunk extends Chunk<string>> =
  Matcher<Chunker<TChunk>, ChunkRange<TChunk>>

export function abstractTextQuoteSelectorMatcher(
  selector: TextQuoteSelector,
): AbstractMatcher<any> {
  return async function* matchAll<TChunk extends Chunk<string>>(textChunks: Chunker<TChunk>) {
    const exact = selector.exact;
    const prefix = selector.prefix || '';
    const suffix = selector.suffix || '';
    const searchPattern = prefix + exact + suffix;

    let partialMatches: Array<{
      startChunk: TChunk;
      startIndex: number;
      charactersMatched: number;
    }> = [];

    let chunk: TChunk | null;
    while (chunk = textChunks.currentChunk) {
      const chunkValue = chunk.data;

      // Continue checking any partial matches from the previous chunk(s).
      const remainingPartialMatches: typeof partialMatches = [];
      for (const { startChunk, startIndex, charactersMatched } of partialMatches) {
        if (searchPattern.length - charactersMatched > chunkValue.length) {
          if (chunkValue === searchPattern.substring(charactersMatched, charactersMatched + chunkValue.length)) {
            // The chunk is too short to complete the match; comparison has to be completed in subsequent chunks.
            remainingPartialMatches.push({
              startChunk,
              startIndex,
              charactersMatched: charactersMatched + chunkValue.length,
            });
          }
        }
        else if (chunkValue.startsWith(searchPattern.substring(charactersMatched))) {
          yield {
            startChunk,
            startIndex,
            endChunk: chunk,
            endIndex: searchPattern.length - charactersMatched,
          };
        }
      }
      partialMatches = remainingPartialMatches;

      // Try find the whole pattern in the chunk (possibly multiple times).
      if (searchPattern.length <= chunkValue.length) {
        let fromIndex = 0;
        while (fromIndex <= chunkValue.length) {
          const patternStartIndex = chunkValue.indexOf(searchPattern, fromIndex);
          if (patternStartIndex === -1) break;

          // Correct for the prefix and suffix lengths.
          const matchStartIndex = patternStartIndex + prefix.length;
          const matchEndIndex = matchStartIndex + exact.length;

          yield {
            startChunk: chunk,
            startIndex: matchStartIndex,
            endChunk: chunk,
            endIndex: matchEndIndex,
          };

          // Advance the search forward to detect multiple occurrences within the same chunk.
          fromIndex = matchStartIndex + 1;
        }
      }

      // Check if this chunk ends with a partial match (or even multiple partial matches).
      let newPartialMatches: number[] = [];
      const searchStartPoint = Math.max(chunkValue.length - searchPattern.length + 1, 0);
      for (let i = searchStartPoint; i < chunkValue.length; i++) {
        const character = chunkValue[i];
        newPartialMatches = newPartialMatches.filter(
          partialMatchStartIndex => (character === searchPattern[i - partialMatchStartIndex])
        );
        if (character === searchPattern[0]) newPartialMatches.push(i);
      }
      for (const partialMatchStartIndex of newPartialMatches) {
        partialMatches.push({
          startChunk: chunk,
          startIndex: partialMatchStartIndex,
          charactersMatched: chunkValue.length - partialMatchStartIndex,
        });
      }

      if (textChunks.nextChunk() === null)
        break;
    }
  };
}
