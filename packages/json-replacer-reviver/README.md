# @neshca/json-replacer-reviver

This package provides a set of functions for encoding and decoding Buffer objects in JSON.

## Installation

```bash
npm i @neshca/json-replacer-reviver
```

## Usage

```js
const buffer = Buffer.from('hello');
console.log(buffer); // <Buffer 68 65 6c 6c 6f>

const json = JSON.stringify(buffer);
console.log(json); // '{"type":"Buffer","data":[104,101,108,108,111]}'

const parsed = JSON.parse(json, reviveFromJsonRepresentation);
console.log(parsed); // <Buffer 68 65 6c 6c 6f>
```

```js
const buffer = Buffer.from('hello');
console.log(buffer); // <Buffer 68 65 6c 6c 6f>

const jsonBase64 = JSON.stringify(buffer, replaceJsonWithBase64);
console.log(jsonBase64); // '{"type":"BufferBase64","data":"aGVsbG8="}'

const parsedFromBase64 = JSON.parse(jsonBase64, reviveFromBase64Representation);
console.log(parsed); // <Buffer 68 65 6c 6c 6f>
```
