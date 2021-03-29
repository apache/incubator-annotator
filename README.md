# [Apache Annotator](http://annotator.apache.org/) (incubating) [![Build Status](https://travis-ci.com/apache/incubator-annotator.svg?branch=master)](https://travis-ci.com/apache/incubator-annotator)

Apache Annotator (incubating) provides libraries to enable annotation related
software, with an initial focus on identification of textual fragments in
browser environments.

## Usage

The Apache Annotator project is written in TypeScript, but the project is
compiled and distributed in CommonJS and ECMAScript Module formats.

The project is made up of multiple packages. Install the `apache-annotator`
package, which includes all sub-packages, or install individual packages from
the `@apache-annotator` scope.

Import packages from either `apache-annotator/package` or
`@apache-annotator/package`.

Currently, the following sub-packages are part of the project:

### `@apache-annotator/dom`

This package contains functions for creating and resolving Web Annotation
Selectors in DOM environments.

### `@apache-annotator/selector`

This package contains generic utilities for composing functions that create
and resolve Web Annotation Selectors.

## Getting Involved

* Join the [mailing list]. Send an email to
  dev-subscribe@apache-annotator.apache.org to subscribe.
* Browse the [issue tracker] and file new issues if you encounter problems.
* Read or contribute to the [wiki].

[mailing list]: http://mail-archives.apache.org/mod_mbox/incubator-annotator-dev/
[issue tracker](https://github.com/apache/incubator-annotator/issues)
[wiki](https://github.com/apache/incubator-annotator/wiki)

### Requirements

We use [Lerna](https://lernajs.io/) to juggle the various Apache Annotator
libraries. If you'd like to contribute, you'll need the following:

- [node](https://nodejs.org) ^10 || ^11 || ^12 || >=13.7
- [yarn](https://www.yarnpkg.com/) ^1.5

#### Setup

```sh
$ yarn install
```

#### Test

```sh
$ yarn test
```

#### Start a local test project

```sh
$ yarn start
```

## Selectors

Many Annotations refer to part of a resource, rather than all of it, as the Target. We call that part of the resource a Segment (of Interest). A Selector is used to describe how to determine the Segment from within the Source resource.

The [W3C Web Annotation Data Model](https://www.w3.org/TR/annotation-model) outlines a number of different selectors. See table below for full list and status.

| Selector                                                                        | Description                                                                                                                                                                                          | Implementation Status |
| ------------------------------------------------------------------------------: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | --------------------: |
| [Text Quote](https://www.w3.org/TR/annotation-model/#text-quote-selector)       | This Selector describes a range of text, including some of the text immediately before (a prefix) and after (a suffix) it to distinguish between multiple copies of the same sequence of characters. | Yes                   |
| [CSS](https://www.w3.org/TR/annotation-model/#css-selector)                     | CSS Selectors allow for a wide variety of well supported ways to describe the path to an element in a web page.                                                                                      | Yes                   |
| [Text Position](https://www.w3.org/TR/annotation-model/#text-position-selector) | This Selector describes a range of text by recording the start and end positions of the selection in the stream.                                                                                     | No                    |
| [Fragment](https://www.w3.org/TR/annotation-model/#fragment-selector)           | Uses the fragment part of an IRI defined by the representation's media type.                                                                                                                         | No                    |
| [XPath](https://www.w3.org/TR/annotation-model/#xpath-selector)                 | Implements an XPath based selection.                                                                                                                                                                 | No                    |
| [Data Postion](https://www.w3.org/TR/annotation-model/#data-position-selector)  | Similar to the Text Position Selector, the Data Position Selector uses the same properties but works at the byte in bitstream level rather than the character in text level.                         | No                    |
| [SVG](https://www.w3.org/TR/annotation-model/#svg-selector)                     | An SvgSelector defines an area through the use of the Scalable Vector Graphics standard.                                                                                                             | No                    |
| [Range](https://www.w3.org/TR/annotation-model/#range-selector)                 | A Range Selector can be used to identify the beginning and the end of the selection by using other Selectors.                                                                                        | Yes                   |
| [Refinement](https://www.w3.org/TR/annotation-model/#refinement-of-selection)   | Select a part of a selection, rather than as a selection of the complete resource.                                                                                                                   |                       |

## Web Annotation Data Model Validation

If you have any Web Annotation Data Model JSON documents, you can validate them
using the `validate` script:

```sh
$ yarn validate --url https://raw.githubusercontent.com/w3c/web-annotation-tests/master/tools/samples/correct/anno1.json
```

With the `--url` option you can pass in a URL or a local path to a JSON file.

### Examples

Valid:

`https://raw.githubusercontent.com/w3c/web-annotation-tests/master/tools/samples/correct/anno1.json`

Invalid:

`https://raw.githubusercontent.com/w3c/web-annotation-tests/master/tools/samples/incorrect/anno1.json`

[(More)](https://github.com/w3c/web-annotation-tests/tree/master/tools/samples)

# License

Apache License 2.0

# Disclaimer

Apache Annotator is currently undergoing incubation at The Apache Software
Foundation.

See the accompanying [DISCLAIMER](./DISCLAIMER-WIP) file for details.
