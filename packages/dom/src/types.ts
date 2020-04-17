import { Matcher } from '../../selector/src';

export type DomScope = Node | Range

export type DomMatcher = Matcher<DomScope, Range>
