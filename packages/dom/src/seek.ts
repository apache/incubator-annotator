import { ownerDocument } from "./owner-document";

const E_END = 'Iterator exhausted before seek ended.';

interface BoundaryPointer<T extends any> {
  readonly referenceNode: T;
  readonly offsetInReferenceNode: number;
}

interface Chunk<TData extends any> {
  // A Chunk has a primary value (typically a string), and any other info that one may want to add to it.
  readonly data: TData;

  // The initial idea was that a Chunk is any toString-able object. Should suffice for us.
  // But it would not let one create e.g. a Chunk with an array of unicode characters.
  // toString(): string;
}

interface Chunker<TChunk extends Chunk<any>> {
  readonly currentChunk: TChunk;
  // read1(): TChunk;
  readNext(): TChunk | null;
  readPrev(): TChunk | null;
  // read(length?: 1 | -1, roundUp?: true): TChunk | null;
}

interface Seeker<T extends Iterable<any> = string> {
  readonly position: number;
  read(length?: number, roundUp?: boolean): T;
  readTo(target: number, roundUp?: boolean): T;
  // read1(length?: number): T;
  seekBy(length: number): void;
  seekTo(target: number): void;
}

interface PartialTextNode extends Chunk<string> {
  readonly node: Text;
  readonly startOffset: number;
  readonly endOffset: number;
}

export class TextNodeChunker implements Chunker<PartialTextNode> {

  private iter: NodeIterator;

  get currentChunk() {
    // The NodeFilter will guarantee this is a Text node (except before the
    // first iteration step, but we do such a step in the constructor).
    const node = this.iter.referenceNode as Text;
    const startOffset = (node === this.scope.startContainer) ? this.scope.startOffset : 0;
    const endOffset = (node === this.scope.endContainer) ? this.scope.endOffset : node.length;
    return {
      node,
      startOffset,
      endOffset,
      data: node.data.substring(startOffset, endOffset),
    }
  }

  constructor(private scope: Range) {
    this.iter = ownerDocument(scope).createNodeIterator(
      scope.commonAncestorContainer,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node: Text) {
          return scope.intersectsNode(node)
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT;
        },
      },
    );

    this.iter.nextNode(); // TODO choose how to handle a range without text nodes.
  }

  readNext() {
    // Move the iterator to after the current node, so nextNode() will cause a jump.
    if (this.iter.pointerBeforeReferenceNode)
      this.iter.nextNode();
    if (this.iter.nextNode())
      return this.currentChunk;
    else
      return null;
  }

  readPrev() {
    if (!this.iter.pointerBeforeReferenceNode)
      this.iter.previousNode();
    if (this.iter.previousNode())
      return this.currentChunk;
    else
      return null;
  }
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

export class TextNodeSeeker extends _TextSeeker<PartialTextNode> implements BoundaryPointer<Text> {
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

class _CharSeeker implements Seeker<string[]> {
  position = 0;

  constructor(public readonly raw: Seeker<string>) {}

  seekBy(length: number) {
    this.seekTo(this.position + length);
  }

  seekTo(target: number) {
    this._readOrSeekTo(false, target);
  }

  read(length: number, roundUp?: boolean) {
    return this.readTo(this.position + length, roundUp);
  }

  readTo(target: number, roundUp?: boolean) {
    return this._readOrSeekTo(true, target, roundUp);
  }

  read1(length?: number) {
    const chunk = this.read(1, true);
    if (length !== undefined && chunk.length > length) {
      // The chunk was larger than requested; walk back a little.
      this.seekBy(length - chunk.length);
      return chunk.slice(0, length);
    } else {
      return chunk;
    }
  }

  private _readOrSeekTo(read: true, target: number, roundUp?: boolean): string[];
  private _readOrSeekTo(read: false, target: number, roundUp?: boolean): void;
  private _readOrSeekTo(read: boolean, target: number, roundUp: boolean = false): string[] | void {
    let result: string[] = [];

    if (this.position < target) {
      let unpairedSurrogate = '';
      let characters: string[] = [];
      while (this.position < target) {
        let s = unpairedSurrogate + this.raw.read(1, true);
        if (endsWithinCharacter(s)) {
          unpairedSurrogate = s.slice(-1); // consider this half-character part of the next string.
          s = s.slice(0,-1);
        } else {
          unpairedSurrogate = '';
        }
        characters = [...s];
        this.position += characters.length;
        if (read) result = result.concat(characters);
      }
      if (unpairedSurrogate) this.raw.seekBy(-1); // align with the last complete character.
      if (!roundUp && this.position > target) {
        const overshootInCodePoints = this.position - target;
        const overshootInCodeUnits = characters.slice(-overshootInCodePoints).join('').length;
        this.position -= overshootInCodePoints;
        this.raw.seekBy(-overshootInCodeUnits);
      }
    } else { // Nearly equal to the if-block, but moving backward in the text.
      let unpairedSurrogate = '';
      let characters: string[] = [];
      while (this.position > target) {
        let s = this.raw.read(-1, true) + unpairedSurrogate;
        if (startsWithinCharacter(s)) {
          unpairedSurrogate = s[0];
          s = s.slice(1);
        } else {
          unpairedSurrogate = '';
        }
        characters = [...s];
        this.position -= characters.length;
        if (read) result = characters.concat(result);
      }
      if (unpairedSurrogate) this.raw.seekBy(1);
      if (!roundUp && this.position < target) {
        const overshootInCodePoints = target - this.position;
        const overshootInCodeUnits = characters.slice(0, overshootInCodePoints).join('').length;
        this.position += overshootInCodePoints;
        this.raw.seekBy(overshootInCodeUnits);
      }
    }

    if (read) return result;
  }
}

export class CharSeeker extends _CharSeeker implements Seeker<string[]>, BoundaryPointer<string[]> {
  constructor(public readonly raw: Seeker<string> & BoundaryPointer<Text>) {
    super(raw);
  }

  get referenceNode() { return [...this.raw.referenceNode.data] };
  get offsetInReferenceNode() {
    const substring = this.raw.referenceNode.data.substring(0, this.raw.offsetInReferenceNode);
    return [...substring].length;
  };
}

function endsWithinCharacter(s: string) {
  const codeUnit = s.charCodeAt(s.length - 1);
  return (0xD800 <= codeUnit && codeUnit <= 0xDBFF)
}

function startsWithinCharacter(s: string) {
  const codeUnit = s.charCodeAt(0);
  return (0xDC00 <= codeUnit && codeUnit <= 0xDFFF)
}
