# [Apache Annotator](http://annotator.apache.org/) (incubating)

> Apache Annotator provides annotation enabling code for browsers, servers,
> and humans.

* [`dev@` Mailing List archive](http://mail-archives.apache.org/mod_mbox/incubator-annotator-dev/)
* [Issue Tracker](https://issues.apache.org/jira/browse/ANNO)
* [Wiki](https://cwiki.apache.org/confluence/display/ANNO)

## Development

##### Requirements

- [node](https://nodejs.org) >= 6.x
- [yarn](https://www.yarnpkg.com/) >= 1.5.x

##### Setup

```sh
$ yarn install
```

##### Test

```sh
$ yarn test
```

By default the Web Annotation JSON-related tests will skipped. To use those
with a specific local file you can use the `--url` parameter plus a local file
path.

```sh
$ yarn test --url ../anno1.json
```

##### Run localhost demo server

```sh
$ yarn start
```

Once the test server has started, you can browse a local demo, and run tests in
a browser by visiting `http://localhost:8080/`.

# License

Apache License 2.0
