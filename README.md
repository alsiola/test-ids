# babel-plugin-test-ids

[![CircleCI](https://img.shields.io/circleci/build/github/alsiola/test-ids/master?style=for-the-badge)](https://circleci.com/gh/alsiola/test-ids/tree/master)
![MIT Licensed](https://img.shields.io/npm/l/babel-plugin-test-ids?style=for-the-badge)
![Language](https://img.shields.io/github/languages/top/alsiola/test-ids?style=for-the-badge)

![Dependencies](https://img.shields.io/requires/github/alsiola/test-ids?label=dependencies&style=for-the-badge)
![Issues](https://img.shields.io/github/issues/alsiola/test-ids?style=for-the-badge)
![Pull Requests](https://img.shields.io/github/issues-pr/alsiola/test-ids?style=for-the-badge)
[![NPM](https://img.shields.io/npm/v/babel-plugin-test-ids?style=for-the-badge)](https://www.npmjs.com/package/babel-plugin-test-ids)

Define test ids with zero runtime cost, and extract them to a JSON file.

## Install

Install the package using:

```
yarn install babel-plugin-test-ids
```

You'll need [babel](https://babeljs.io/) `>7.0.0` installed.

## Usage

There are two parts to this package:

* A babel plugin
    - Transforms code to replace "magic" test ids with string literals
    - Extracts found test ids to JSON files
* CLI program
    - Combines extracted test ids into a single file

### Babel plugin

#### Setup

The plugin should be added to the `plugins` array in your babel configuration.

```
module.exports = {
    plugins: [
        "test-ids"
    ]
};
```

There are two available configuration options, both optional.

* `extractTo`
    - String, optional, default `undefined`
    - Folder location to write extracted test ids
    - Relative to current working directory
    - If not defined, no files will be written
* `magicObject`
    - String, optional, default `$TestId`
    - Name of the "magic object" to look for (see below)

#### Using the magic object

The `$TestId` magic object can now be used in your code. It can be used in plain JavaScript files, or (subject to appropriate plugins),
JSX.  Property access will be transformed by the plugin into a string literal containing the name of the value identifier. The value
of the injected string literal will then be extracted to a JSON file, in a tree structure matching the original file.

Input (`src/test/file.js`)
```
const foo = {
    bar: $TestId.MyTestId
}
```

Transformed (`src/test/file.js`)
```
const foo = {
    bar: "MyTestId"
}
```

Extracted (`test-ids/src/test/file.json`)
```
[
    "MyTestId"
]
```

### CLI

Often it is desirable to have a single "master" file of test ids. This can be generated using the provided `glob-test-ids` program.

There are two inputs, both required:

`-i, --ids-location` Glob-style location of previously generated extracted test ids
`-o, --output` Location to output master file

package.json
```
{
    "scripts": {
        "glob": "glob-test-ids -i ./test-ids/src/**/*.json -o ./test-ids/master.json"
    }
}
```
