export interface Selector {
  refinedBy?: Selector,
}

export interface CssSelector extends Selector {
  type: 'CssSelector',
  value: string,
}

export interface TextQuoteSelector extends Selector {
  type: 'TextQuoteSelector',
  exact: string,
  prefix?: string,
  suffix?: string,
}

export interface RangeSelector extends Selector {
  type: 'RangeSelector',
  startSelector: Selector,
  endSelector: Selector,
}

export interface Matcher<TScope, TMatch> {
  (scope: TScope): AsyncGenerator<TMatch, void, void>,
}
