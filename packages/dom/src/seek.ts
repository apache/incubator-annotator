import { ownerDocument } from "./owner-document";

const E_END = 'Iterator exhausted before seek ended.';

interface BoundaryPointer<T extends any = Node> {
  readonly referenceNode: T;
  readonly offsetInReferenceNode: number;
}

interface Chunker<T extends Iterable<any> = string> {
  read1(): T;
  // read previous chunk?
}

interface Seeker<T extends Iterable<any> = string> extends Chunker<T> {
  readonly position: number;
  read(length: number, roundUp?: boolean): T;
  readTo(target: number, roundUp?: boolean): T;
  read1(length?: number): T;
  seekBy(length: number): void;
  seekTo(target: number): void;
}

export class TextSeeker implements Seeker, BoundaryPointer<Text> {
  // The node containing our current text position.
  get referenceNode(): Text {
    // The NodeFilter will guarantee this is a Text node (except before the
    // first iteration step, but we do such a step in the constructor).
    return this.iter.referenceNode as Text;
  }

  // The position inside iter.referenceNode where the last seek ended up.
  offsetInReferenceNode = 0;

  // The index of the first character of iter.referenceNode inside the text.
  private referenceNodePosition = 0;

  // The current text position (measured in code units)
  get position() { return this.referenceNodePosition + this.offsetInReferenceNode; }

  private iter: NodeIterator;

  constructor(scope: Range) {
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

    if (isText(scope.startContainer)) {
      // The scope starts inside the text node. Adjust our index accordingly.
      this.referenceNodePosition = -scope.startOffset;
      this.offsetInReferenceNode = scope.startOffset;
    }
    // TODO Handle the scope.endOffset as well, and fix behaviour in edge cases
    // (e.g. any use of referenceNode.length is incorrect at the edges).
    // Or rather, just extract this Range stuff into a Chunker, that cuts off
    // those edges that fall outside the scope.

    // Walk to the start of the first non-empty text node inside the scope.
    this.seekTo(0); // TODO choose how to handle a range without text nodes.
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
      // Move the iterator to after the current node, so nextNode() would cause a jump.
      if (this.iter.pointerBeforeReferenceNode)
        this.iter.nextNode();

      while (this.position <= target) { // could be `while (true)`?
        if (!roundUp && target < this.referenceNodePosition + this.referenceNode.length) {
          // The target is before the end of the current node.
          // (we use < not ≤: if the target is *at* the end of the node, possibly
          // because the current node is empty, we prefer to take the next node)
          const newOffset = target - this.referenceNodePosition;
          if (read) result += this.referenceNode.data.substring(this.offsetInReferenceNode, newOffset);
          this.offsetInReferenceNode = newOffset;
          break;
        } else {
          // Move to the start of the next node, while counting the characters of the current one.
          if (read) result += this.referenceNode.data.substring(this.offsetInReferenceNode);
          const nodeLength = this.referenceNode.length;
          let nextNode = this.iter.nextNode() as Text | null;
          if (nextNode !== null) {
            // Skip empty nodes.
            while (nextNode && nextNode.length === 0)
              nextNode = this.iter.nextNode() as Text | null;
            this.referenceNodePosition += nodeLength;
            this.offsetInReferenceNode = 0;
          } else {
            // There is no next node. Finish at the end of the last node.
            this.offsetInReferenceNode = nodeLength;
            // Either the end of this node is (beyond) our target, or the seek failed.
            // (note that if roundUp is false then this.position ≤ target is guaranteed, so this would simply test for equality)
            if (this.position >= target)
              break;
            else
              throw new RangeError(E_END);
          }
        }
      }
    } else { // Similar to the if-block, but moving backward in the text.
      if (!this.iter.pointerBeforeReferenceNode)
        this.iter.previousNode();

      while (this.position > target) {
        if (this.referenceNodePosition <= target) {
          // The target is within the current node.
          const newOffset = roundUp ? 0 : target - this.referenceNodePosition;
          if (read) result = this.referenceNode.data.substring(newOffset, this.offsetInReferenceNode) + result;
          this.offsetInReferenceNode = newOffset;
          break;
        } else {
          // Move to the end of the previous node.
          if (read) result = this.referenceNode.data.substring(0, this.offsetInReferenceNode) + result;
          const prevNode = this.iter.previousNode() as Text | null;
          if (prevNode !== null) {
            this.referenceNodePosition -= this.referenceNode.length;
            this.offsetInReferenceNode = this.referenceNode.length;
          } else {
            this.offsetInReferenceNode = 0;
            throw new RangeError(E_END);
          }
        }
      }
    }

    if (read) return result;
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

function isText(node: Node): node is Text {
  return node.nodeType === Node.TEXT_NODE;
}

function endsWithinCharacter(s: string) {
  const codeUnit = s.charCodeAt(s.length - 1);
  return (0xD800 <= codeUnit && codeUnit <= 0xDBFF)
}

function startsWithinCharacter(s: string) {
  const codeUnit = s.charCodeAt(0);
  return (0xDC00 <= codeUnit && codeUnit <= 0xDFFF)
}
