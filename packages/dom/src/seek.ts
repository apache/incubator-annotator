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

import { Chunk, Chunker, TextNodeChunker, PartialTextNode, chunkEquals } from "./chunker";

const E_END = 'Iterator exhausted before seek ended.';

export interface NonEmptyChunker<TChunk extends Chunk<any>> extends Chunker<TChunk> {
  readonly currentChunk: TChunk;
}

export interface BoundaryPointer<T extends any> {
  readonly referenceNode: T;
  readonly offsetInReferenceNode: number;
}

export interface Seeker<T extends Iterable<any> = string> {
  readonly position: number;
  read(length?: number, roundUp?: boolean): T;
  readTo(target: number, roundUp?: boolean): T;
  seekBy(length: number): void;
  seekTo(target: number): void;
}

export class TextSeeker<TChunk extends Chunk<string>> implements Seeker<string> {
  // The chunk containing our current text position.
  get currentChunk() {
    return this.chunker.currentChunk;
  }

  // The index of the first character of the current chunk inside the text.
  private currentChunkPosition = 0;

  // The position inside the chunk where the last seek ended up.
  offsetInChunk = 0;

  // The current text position (measured in code units)
  get position() { return this.currentChunkPosition + this.offsetInChunk; }

  constructor(protected chunker: NonEmptyChunker<TChunk>) {
    // Walk to the start of the first non-empty chunk inside the scope.
    this.seekTo(0);
  }

  read(length: number, roundUp: boolean = false) {
    return this.readTo(this.position + length, roundUp);
  }

  readTo(target: number, roundUp: boolean = false) {
    return this._readOrSeekTo(true, target, roundUp);
  }

  seekBy(length: number) {
    this.seekTo(this.position + length);
  }

  seekTo(target: number) {
    this._readOrSeekTo(false, target);
  }

  seekToChunk(target: TChunk, offset: number = 0) {
    this._readOrSeekToChunk(false, target, offset);
  }

  readToChunk(target: TChunk, offset: number = 0): string {
    return this._readOrSeekToChunk(true, target, offset);
  }

  private _readOrSeekToChunk(read: true, target: TChunk, offset?: number): string
  private _readOrSeekToChunk(read: false, target: TChunk, offset?: number): void
  private _readOrSeekToChunk(read: boolean, target: TChunk, offset: number = 0): string | void {
    const oldPosition = this.position;
    let result = '';

    // Walk to the requested chunk.
    if (!this.chunker.precedesCurrentChunk(target)) { // Search forwards.
      while (!chunkEquals(this.currentChunk, target)) {
        const [data, nextChunk] = this._readToNextChunk();
        if (read) result += data;
        if (nextChunk === null)
          throw new RangeError(E_END);
      }
    } else { // Search backwards.
      while (!chunkEquals(this.currentChunk, target)) {
        const [data, previousChunk] = this._readToPreviousChunk();
        if (read) result = data + result;
        if (previousChunk === null)
          throw new RangeError(E_END);
      }
    }

    // Now we know where the chunk is, walk to the requested offset.
    // Note we might have started inside the chunk, and the offset could even
    // point to a position before or after the chunk.
    const targetPosition = this.currentChunkPosition + offset;
    if (!read) {
      this.seekTo(targetPosition);
    } else {
      if (targetPosition >= this.position) {
        // Read further until the target.
        result += this.readTo(targetPosition);
      }
      else if (targetPosition >= oldPosition) {
        // We passed by our target position: step back.
        this.seekTo(targetPosition);
        result = result.slice(0, targetPosition - oldPosition);
      } else {
        // The target precedes our starting position: read backwards from there.
        this.seekTo(oldPosition);
        result = this.readTo(targetPosition);
      }
      return result;
    }
  }

  private _readOrSeekTo(read: true, target: number, roundUp?: boolean): string
  private _readOrSeekTo(read: false, target: number, roundUp?: boolean): void
  private _readOrSeekTo(read: boolean, target: number, roundUp: boolean = false): string | void {
    let result = '';

    if (this.position <= target) {
      while (true) {
        if (this.currentChunkPosition + this.currentChunk.data.length <= target) {
          // The target is beyond the current chunk.
          // (we use < not ≤: if the target is *at* the end of the chunk, possibly
          // because the current chunk is empty, we prefer to take the next chunk)

          const [data, nextChunk] = this._readToNextChunk();
          if (read) result += data;
          if (nextChunk === null) {
            if (this.position === target)
              break;
            else
              throw new RangeError(E_END);
          }
        } else {
          // The target is within the current chunk.
          const newOffset = roundUp ? this.currentChunk.data.length : target - this.currentChunkPosition;
          if (read) result += this.currentChunk.data.substring(this.offsetInChunk, newOffset);
          this.offsetInChunk = newOffset;

          // If we finish end at the end of the chunk, seek to the start of the next non-empty node.
          // (TODO decide: should we keep this guarantee of not finishing at the end of a chunk?)
          if (roundUp) this.seekBy(0);

          break;
        }
      }
    } else { // Similar to the if-block, but moving backward in the text.
      while (this.position > target) {
        if (this.currentChunkPosition <= target) {
          // The target is within the current chunk.
          const newOffset = roundUp ? 0 : target - this.currentChunkPosition;
          if (read) result = this.currentChunk.data.substring(newOffset, this.offsetInChunk) + result;
          this.offsetInChunk = newOffset;
          break;
        } else {
          const [data, previousChunk] = this._readToPreviousChunk();
          if (read) result = data + result;
          if (previousChunk === null)
            throw new RangeError(E_END);
        }
      }
    }

    if (read) return result;
  }

  // Read to the start of the next chunk, if any; otherwise to the end of the current chunk.
  _readToNextChunk(): [string, TChunk | null] {
    const data = this.currentChunk.data.substring(this.offsetInChunk);
    const chunkLength = this.currentChunk.data.length;
    const nextChunk = this.chunker.nextChunk();
    if (nextChunk !== null) {
      this.currentChunkPosition += chunkLength;
      this.offsetInChunk = 0;
    } else {
      this.offsetInChunk = chunkLength;
    }
    return [data, nextChunk];
  }

  // Read backwards to the end of the previous chunk, if any; otherwise to the start of the current chunk.
  _readToPreviousChunk(): [string, TChunk | null] {
    const data = this.currentChunk.data.substring(0, this.offsetInChunk);
    const previousChunk = this.chunker.previousChunk();
    if (previousChunk !== null) {
      this.currentChunkPosition -= this.currentChunk.data.length;
      this.offsetInChunk = this.currentChunk.data.length;
    } else {
      this.offsetInChunk = 0;
    }
    return [data, previousChunk];
  }
}

export class DomSeeker extends TextSeeker<PartialTextNode> implements BoundaryPointer<Text> {
  constructor(scope: Range) {
    const chunker = new TextNodeChunker(scope);
    if (chunker.currentChunk === null)
      throw new RangeError('Range does not contain any Text nodes.');
    super(chunker as NonEmptyChunker<PartialTextNode>);
  }

  get referenceNode() {
    return this.currentChunk.node;
  }

  get offsetInReferenceNode() {
    return this.offsetInChunk + this.currentChunk.startOffset;
  }
}
