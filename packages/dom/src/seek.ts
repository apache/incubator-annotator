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

import { Chunk, Chunker, TextNodeChunker, PartialTextNode } from "./chunker";

const E_END = 'Iterator exhausted before seek ended.';

export interface BoundaryPointer<T extends any> {
  readonly referenceNode: T;
  readonly offsetInReferenceNode: number;
}

export interface Seeker<T extends Iterable<any> = string> {
  readonly position: number;
  read(length?: number, roundUp?: boolean): T;
  readTo(target: number, roundUp?: boolean): T;
  // read1(length?: number): T;
  seekBy(length: number): void;
  seekTo(target: number): void;
}

class _TextSeeker<TChunk extends Chunk<string>> implements Seeker<string> {
  // The index of the first character of the current chunk inside the text.
  private currentChunkPosition = 0;

  // The position inside the chunk where the last seek ended up.
  protected offsetInChunk = 0;

  // The current text position (measured in code units)
  get position() { return this.currentChunkPosition + this.offsetInChunk; }

  constructor(protected chunker: Chunker<TChunk>) {
    // Walk to the start of the first non-empty chunk inside the scope.
    this.seekTo(0);
  }

  read(length: number, roundUp: boolean = false) {
    return this.readTo(this.position + length, roundUp);
  }

  readTo(target: number, roundUp: boolean = false) {
    return this._readOrSeekTo(true, target, roundUp);
  }

  read1(length?: number) {
    const chunk = this.read(1, true);
    if (length !== undefined && chunk.length > length) {
      // The chunk was larger than requested; walk back a little.
      this.seekBy(length - chunk.length);
      return chunk.substring(0, length);
    } else {
      return chunk;
    }
  }

  seekBy(length: number) {
    this.seekTo(this.position + length);
  }

  seekTo(target: number) {
    this._readOrSeekTo(false, target);
  }

  private _readOrSeekTo(read: true, target: number, roundUp?: boolean): string
  private _readOrSeekTo(read: false, target: number, roundUp?: boolean): void
  private _readOrSeekTo(read: boolean, target: number, roundUp: boolean = false): string | void {
    let result = '';

    if (this.position <= target) {
      while (this.position <= target) { // could be `while (true)`?
        if (!roundUp && target < this.currentChunkPosition + this.chunker.currentChunk.data.length) {
          // The target is before the end of the current chunk.
          // (we use < not ≤: if the target is *at* the end of the chunk, possibly
          // because the current chunk is empty, we prefer to take the next chunk)
          const newOffset = target - this.currentChunkPosition;
          if (read) result += this.chunker.currentChunk.data.substring(this.offsetInChunk, newOffset);
          this.offsetInChunk = newOffset;
          break;
        } else {
          // Move to the start of the next chunk, while counting the characters of the current one.
          if (read) result += this.chunker.currentChunk.data.substring(this.offsetInChunk);
          const chunkLength = this.chunker.currentChunk.data.length;
          let nextChunk = this.chunker.readNext();
          if (nextChunk !== null) {
            // Skip empty chunks.
            while (nextChunk && nextChunk.data.length === 0)
              nextChunk = this.chunker.readNext();
            this.currentChunkPosition += chunkLength;
            this.offsetInChunk = 0;
          } else {
            // There is no next chunk. Finish at the end of the last chunk.
            this.offsetInChunk = chunkLength;
            // Either the end of this chunk is (beyond) our target, or the seek failed.
            // (note that if roundUp is false then this.position ≤ target is guaranteed, so this would simply test for equality)
            if (this.position >= target)
              break;
            else
              throw new RangeError(E_END);
          }
        }
      }
    } else { // Similar to the if-block, but moving backward in the text.
      while (this.position > target) {
        if (this.currentChunkPosition <= target) {
          // The target is within the current chunk.
          const newOffset = roundUp ? 0 : target - this.currentChunkPosition;
          if (read) result = this.chunker.currentChunk.data.substring(newOffset, this.offsetInChunk) + result;
          this.offsetInChunk = newOffset;
          break;
        } else {
          // Move to the end of the previous chunk.
          if (read) result = this.chunker.currentChunk.data.substring(0, this.offsetInChunk) + result;
          const prevChunk = this.chunker.readPrev();
          if (prevChunk !== null) {
            this.currentChunkPosition -= this.chunker.currentChunk.data.length;
            this.offsetInChunk = this.chunker.currentChunk.data.length;
          } else {
            this.offsetInChunk = 0;
            throw new RangeError(E_END);
          }
        }
      }
    }

    if (read) return result;
  }
}

export class TextSeeker<TChunk extends Chunk<string>> extends _TextSeeker<TChunk> implements BoundaryPointer<TChunk> {
  // The chunk containing our current text position.
  get referenceNode() {
    return this.chunker.currentChunk;
  }

  get offsetInReferenceNode() {
    return this.offsetInChunk;
  }
}

export class DomSeeker extends _TextSeeker<PartialTextNode> implements BoundaryPointer<Text> {
  constructor(scope: Range) {
    const chunker = new TextNodeChunker(scope);
    super(chunker);
  }

  get referenceNode() {
    return this.chunker.currentChunk.node;
  }

  get offsetInReferenceNode() {
    return this.offsetInChunk + this.chunker.currentChunk.startOffset;
  }
}
