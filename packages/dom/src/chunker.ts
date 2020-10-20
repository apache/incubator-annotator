import { ownerDocument } from "./owner-document";

export interface Chunk<TData extends any> {
  // A Chunk has a primary value (typically a string), and any other info that one may want to add to it.
  readonly data: TData;

  // The initial idea was that a Chunk is any toString-able object. Should suffice for us.
  // But it would not let one create e.g. a Chunk with an array of unicode characters.
  // toString(): string;
}

export interface Chunker<TChunk extends Chunk<any>> {
  readonly currentChunk: TChunk;
  readNext(): TChunk | null;
  readPrev(): TChunk | null;
  // read(length?: 1 | -1, roundUp?: true): TChunk | null;
}

export interface PartialTextNode extends Chunk<string> {
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
