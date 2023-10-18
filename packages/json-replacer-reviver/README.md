# @neshca/json-replacer-reviver

Utility library for handling `Buffer` object serialization and deserialization with JSON, offering base64 representations.

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

## Developing and contributing

[Developing and contributing in this monorepo](../../docs/contributing/monorepo.md)

### Running tests locally

```bash
npm run test -w ./packages/json-replacer-reviver
```

## License

[MIT](./LICENSE)
