# [Apache Annotator](http://annotator.apache.org/) (incubating) [![Build Status](https://travis-ci.org/apache/incubator-annotator.svg?branch=master)](https://travis-ci.org/apache/incubator-annotator)

> Apache Annotator provides annotation enabling code for browsers, servers,
> and humans.

* [`dev@` Mailing List archive](http://mail-archives.apache.org/mod_mbox/incubator-annotator-dev/)
* [Issue Tracker](https://github.com/apache/incubator-annotator/issues)
* [Wiki](https://github.com/apache/incubator-annotator/wiki)

## Usage

We're currently pre-releasing development copies of each library that makes up
the sum total of Apache Annotator's code. You can grab any of them from our
[npm organization](https://www.npmjs.com/org/annotator).

```sh
$ # for example...
$ npm install --save @annotator/dom
```

##### Requirements

- [node](https://nodejs.org) >= 10.x
- [yarn](https://www.yarnpkg.com/) >= 1.5.1


## Development

##### Requirements

We use [Lerna](https://lernajs.io/) to juggle the various Apache Annotator
libraries. If you'd like to contribute, you'll need the following:

- [node](https://nodejs.org) >= 10.x
- [yarn](https://www.yarnpkg.com/) >= 1.5.1

##### Setup

```sh
$ yarn install
```

##### Test

```sh
$ yarn test
```

##### Run localhost demo server

```sh
$ yarn start
```

Once the test server has started, you can browse a local demo, and run tests in
a browser by visiting `http://localhost:8080/`.

##### Validate Licensing

[Apache Rat (Release Audit Tool)](https://creadur.apache.org/rat/) is a
preferred code license checking tool used by [the ASF](https://apache.org/).
The included `.ratignore` file contains a list of files to exclude from scans.

To check for included licenses, run the following and view the output report:
```sh
java -jar ~/bin/apache-rat-0.13/apache-rat-0.13.jar -E .ratignore -d . > rat_report.txt
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

##### Examples

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

See the accompanying [DISCLAIMER](./DISCLAIMER) file for details.
