import { TextQuoteSelector } from "../../selector/src";
import { RangeInfo } from "./utils";

const testCases: {
  [name: string]: {
    html: string,
    selector: TextQuoteSelector,
    expected: RangeInfo[],
  }
} = {
  'simple': {
    html: '<b>lorem ipsum dolor amet yada yada</b>',
    selector: {
      type: 'TextQuoteSelector',
      exact: 'dolor am',
    },
    expected: [
      {
        startContainerXPath: '//b/text()',
        startOffset: 12,
        endContainerXPath: '//b/text()',
        endOffset: 20,
      },
    ],
  },
  'first characters': {
    html: '<b>lorem ipsum dolor amet yada yada</b>',
    selector: {
      type: 'TextQuoteSelector',
      exact: 'lorem ipsum',
    },
    expected: [
      {
        startContainerXPath: '//b/text()',
        startOffset: 0,
        endContainerXPath: '//b/text()',
        endOffset: 11,
      },
    ],
  },
  'last characters': {
    html: '<b>lorem ipsum dolor amet yada yada</b>',
    selector: {
      type: 'TextQuoteSelector',
      exact: 'yada yada',
    },
    expected: [
      {
        startContainerXPath: '//b/text()',
        startOffset: 23,
        endContainerXPath: '//b/text()',
        endOffset: 32,
      },
    ],
  },
  'across elements': {
    html: '<b>lorem <i>ipsum</i> dolor <u>amet</u> yada yada</b>',
    selector: {
      type: 'TextQuoteSelector',
      exact: 'dolor am',
    },
    expected: [
      {
        startContainerXPath: '//b/text()[2]',
        startOffset: 1,
        endContainerXPath: '//u/text()',
        endOffset: 2,
      },
    ],
  },
  'exact element contents': {
    html: '<b>lorem <i>ipsum dolor</i> amet yada yada</b>',
    selector: {
      type: 'TextQuoteSelector',
      exact: 'ipsum dolor',
    },
    expected: [
      {
        startContainerXPath: '//i/text()',
        startOffset: 0,
        endContainerXPath: '//b/text()[2]',
        endOffset: 0,
      },
    ],
  },
  'text inside <head>': {
    html: '<head><title>The title</title></head><b>lorem ipsum dolor amet yada yada</b>',
    selector: {
      type: 'TextQuoteSelector',
      exact: 'title',
    },
    expected: [
      {
        startContainerXPath: '//title/text()',
        startOffset: 4,
        endContainerXPath: '//b/text()[1]',
        endOffset: 0,
      },
    ],
  },
  'two matches': {
    html: '<b>lorem ipsum dolor amet yada yada</b>',
    selector: {
      type: 'TextQuoteSelector',
      exact: 'yada',
    },
    expected: [
      {
        startContainerXPath: '//b/text()',
        startOffset: 23,
        endContainerXPath: '//b/text()',
        endOffset: 27,
      },
      {
        startContainerXPath: '//b/text()',
        startOffset: 28,
        endContainerXPath: '//b/text()',
        endOffset: 32,
      },
    ],
  },
  'overlapping matches': {
    html: '<b>bananas</b>',
    selector: {
      type: 'TextQuoteSelector',
      exact: 'ana',
    },
    expected: [
      {
        startContainerXPath: '//b/text()',
        startOffset: 1,
        endContainerXPath: '//b/text()',
        endOffset: 4,
      },
      {
        startContainerXPath: '//b/text()',
        startOffset: 3,
        endContainerXPath: '//b/text()',
        endOffset: 6,
      },
    ],
  },
  'no matches': {
    html: '<b>lorem ipsum dolor amet yada yada</b>',
    selector: {
      type: 'TextQuoteSelector',
      exact: 'holy grail',
    },
    expected: [],
  },
  'with prefix': {
    html: '<b>lorem ipsum dolor amet yada yada</b>',
    selector: {
      type: 'TextQuoteSelector',
      exact: 'yada',
      prefix: 't ',
    },
    expected: [
      {
        startContainerXPath: '//b/text()',
        startOffset: 23,
        endContainerXPath: '//b/text()',
        endOffset: 27,
      },
    ],
  },
  'with suffix': {
    html: '<b>lorem ipsum dolor amet yada yada</b>',
    selector: {
      type: 'TextQuoteSelector',
      exact: 'o',
      suffix: 'l',
    },
    expected: [
      {
        startContainerXPath: '//b/text()',
        startOffset: 13,
        endContainerXPath: '//b/text()',
        endOffset: 14,
      },
    ],
  },
  'with prefix and suffix': {
    html: '<b>lorem ipsum dolor amet yada yada</b>',
    selector: {
      type: 'TextQuoteSelector',
      exact: 'o',
      prefix: 'l',
      suffix: 're',
    },
    expected: [
      {
        startContainerXPath: '//b/text()',
        startOffset: 1,
        endContainerXPath: '//b/text()',
        endOffset: 2,
      },
    ],
  },
  'with prefix and suffix, two matches': {
    html: '<b>lorem ipsum dolor amet yada yada</b>',
    selector: {
      type: 'TextQuoteSelector',
      exact: 'o',
      prefix: 'l',
      suffix: 'r',
    },
    expected: [
      {
        startContainerXPath: '//b/text()',
        startOffset: 1,
        endContainerXPath: '//b/text()',
        endOffset: 2,
      },
      {
        startContainerXPath: '//b/text()',
        startOffset: 15,
        endContainerXPath: '//b/text()',
        endOffset: 16,
      },
    ],
  },
  'with prefix, no matches': {
    html: '<b>lorem ipsum dolor amet yada yada</b>',
    selector: {
      type: 'TextQuoteSelector',
      exact: 'dolor',
      prefix: 'oopsum ',
    },
    expected: [],
  },
  'with suffix, no matches': {
    html: '<b>lorem ipsum dolor amet yada yada</b>',
    selector: {
      type: 'TextQuoteSelector',
      exact: 'dolor',
      suffix: ' amot',
    },
    expected: [],
  },
  'with suffix, no matches due to whitespace': {
    html: '<b>lorem ipsum dolor amet yada yada</b>',
    selector: {
      type: 'TextQuoteSelector',
      exact: 'dolor',
      suffix: 'a',
    },
    expected: [],
  },
  'with empty prefix and suffix': {
    html: '<b>lorem ipsum dolor amet yada yada</b>',
    selector: {
      type: 'TextQuoteSelector',
      exact: 'dolor am',
      prefix: '',
      suffix: '',
    },
    expected: [
      {
        startContainerXPath: '//b/text()',
        startOffset: 12,
        endContainerXPath: '//b/text()',
        endOffset: 20,
      },
    ],
  },
  'empty quote': {
    html: '<b>lorem</b>',
    selector: {
      type: 'TextQuoteSelector',
      exact: '',
    },
    // A five character string contains six spots to find an empty string
    expected: Array(6).fill(null).map((_, i) => ({
      startContainerXPath: '//b/text()',
      startOffset: i,
      endContainerXPath: '//b/text()',
      endOffset: i,
    }))
  },
  'empty quote, with prefix': {
    html: '<b>lorem ipsum dolor amet yada yada</b>',
    selector: {
      type: 'TextQuoteSelector',
      exact: '',
      prefix: 'dolor',
    },
    expected: [{
      startContainerXPath: '//b/text()',
      startOffset: 17,
      endContainerXPath: '//b/text()',
      endOffset: 17,
    }]
  },
  'empty quote, with suffix': {
    html: '<b>lorem ipsum dolor amet yada yada</b>',
    selector: {
      type: 'TextQuoteSelector',
      exact: '',
      suffix: 'i',
    },
    expected: [{
      startContainerXPath: '//b/text()',
      startOffset: 6,
      endContainerXPath: '//b/text()',
      endOffset: 6,
    }]
  },
  'empty quote, with prefix and suffix': {
    html: '<b>lorem ipsum dolor amet yada yada</b>',
    selector: {
      type: 'TextQuoteSelector',
      exact: '',
      prefix: 'lorem ',
      suffix: 'ipsum',
    },
    expected: [{
      startContainerXPath: '//b/text()',
      startOffset: 6,
      endContainerXPath: '//b/text()',
      endOffset: 6,
    }]
  },
  'empty quote, no matches': {
    html: '<b>lorem ipsum dolor amet yada yada</b>',
    selector: {
      type: 'TextQuoteSelector',
      exact: '',
      prefix: 'X',
    },
    expected: [],
  }
};

export default testCases;