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

import type { TextQuoteSelector } from '../types';
import type { Chunk, Chunker, ChunkRange } from './chunker';
import { chunkRangeEquals } from './chunker';
import type { RelativeSeeker } from './seeker';
import { TextSeeker } from './seeker';
import { textQuoteSelectorMatcher } from '.';

export async function describeTextQuote<TChunk extends Chunk<string>>(
  target: ChunkRange<TChunk>,
  scope: () => Chunker<TChunk>,
): Promise<TextQuoteSelector> {
  const seeker = new TextSeeker(scope());

  // Read the target’s exact text.
  seeker.seekToChunk(target.startChunk, target.startIndex);
  const exact = seeker.readToChunk(target.endChunk, target.endIndex);

  // Starting with an empty prefix and suffix, we search for matches. At each unintended match
  // we encounter, we extend the prefix or suffix just enough to ensure it will no longer match.
  let prefix = '';
  let suffix = '';

  while (true) {
    const tentativeSelector: TextQuoteSelector = {
      type: 'TextQuoteSelector',
      exact,
      prefix,
      suffix,
    };

    const matches = textQuoteSelectorMatcher(tentativeSelector)(
      scope(),
    );
    let nextMatch = await matches.next();

    // If this match is the intended one, no need to act.
    // XXX This test is fragile: nextMatch and target are assumed to be normalised.
    if (!nextMatch.done && chunkRangeEquals(nextMatch.value, target)) {
      nextMatch = await matches.next();
    }

    // If there are no more unintended matches, our selector is unambiguous!
    if (nextMatch.done) return tentativeSelector;

    // Possible optimisation: A subsequent search could safely skip the part we
    // already processed, instead of starting from the beginning again. But we’d
    // need the matcher to start at the seeker’s position, instead of searching
    // in the whole current chunk. Then we could just seek back to just after
    // the start of the prefix: seeker.seekBy(-prefix.length + 1); (don’t forget
    // to also correct for any changes in the prefix we will make below)

    // We’ll have to add more prefix/suffix to disqualify this unintended match.
    const unintendedMatch = nextMatch.value;

    // Create two seekers to simultaneously read characters near both the target
    // and the unintended match.
    // Possible optimisation: as these need not be AbsoluteSeekers, a different
    // implementation could provide direct ‘jump’ access in seekToChunk (the
    // scope’s Chunker would of course also have to support this).
    const seeker1 = new TextSeeker(scope());
    const seeker2 = new TextSeeker(scope());

    // Count how many characters we’d need as a prefix to disqualify this match.
    seeker1.seekToChunk(target.startChunk, target.startIndex - prefix.length);
    seeker2.seekToChunk(
      unintendedMatch.startChunk,
      unintendedMatch.startIndex - prefix.length,
    );
    const extraPrefix = readUntilDifferent(seeker1, seeker2, true);

    // Count how many characters we’d need as a suffix to disqualify this match.
    seeker1.seekToChunk(target.endChunk, target.endIndex + suffix.length);
    seeker2.seekToChunk(
      unintendedMatch.endChunk,
      unintendedMatch.endIndex + suffix.length,
    );
    const extraSuffix = readUntilDifferent(seeker1, seeker2, false);

    // Use either the prefix or suffix, whichever is shortest.
    if (
      extraPrefix !== undefined &&
      (extraSuffix === undefined || extraPrefix.length <= extraSuffix.length)
    ) {
      prefix = extraPrefix + prefix;
    } else if (extraSuffix !== undefined) {
      suffix = suffix + extraSuffix;
    } else {
      throw new Error(
        'Target cannot be disambiguated; how could that have happened‽',
      );
    }
  }
}

function readUntilDifferent(
  seeker1: RelativeSeeker,
  seeker2: RelativeSeeker,
  reverse: boolean,
): string | undefined {
  let result = '';
  while (true) {
    let nextCharacter: string;
    try {
      nextCharacter = seeker1.read(reverse ? -1 : 1);
    } catch (err) {
      return undefined; // Start/end of text reached: cannot expand result.
    }
    result = reverse ? nextCharacter + result : result + nextCharacter;

    // Check if the newly added character makes the result differ from the second seeker.
    let comparisonCharacter: string | undefined;
    try {
      comparisonCharacter = seeker2.read(reverse ? -1 : 1);
    } catch (err) {
      // A RangeError would merely mean seeker2 is exhausted.
      if (!(err instanceof RangeError)) throw err;
    }
    if (nextCharacter !== comparisonCharacter) return result;
  }
}
