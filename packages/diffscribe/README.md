# diffscribe

`diffscribe` is an intelligent CLI tool designed to automatically generate meaningful commit messages using Git diffstat, status, and insights from OpenAI and you.

Please note that this project is in its beta version and may undergo significant changes.

[![npm package](https://img.shields.io/npm/v/diffscribe/latest.svg)](https://www.npmjs.com/package/diffscribe)
[![Dependencies](https://img.shields.io/npm/dm/diffscribe)](https://www.npmjs.com/package/diffscribe)
[![License](https://img.shields.io/npm/l/express.svg)](https://github.com/caching-tools/next-shared-cache/blob/canary/packages/diffscribe/LICENSE)

## Features:

-   **Smart Analysis**: Evaluates Git status and Git diffstat to identify essential changes.
-   **Security**: Your code stays with you – no sharing with OpenAI.
-   **User Interaction**: Engages with you to refine its interpretations.
-   **OpenAI Power**: Uses the OpenAI API to create concise, descriptive commit messages.
-   **Customizable**: Offers customization options like model type, temperature, and commit message length.

## Prerequisites:

-   Node.js `>=18.17.0`
-   Git `>=2`
-   An OpenAI API key. You can get one [here](https://platform.openai.com/account/api-keys)
-   `.env` file with `OPENAI_API_KEY` set to your OpenAI API key.

## Installation:

You can install the tool locally or globally.

```bash
npm i -g diffscribe
# or for local usage
npm i -D diffscribe
```

The package has peer dependencies on `openai` to use the OpenAI API and `dotenv` to load the `.env` file.

```bash
npm i -g openai dotenv
# or for local usage
npm i -D openai dotenv
```

## Usage:

1. Make sure you have staged your changes in Git (`git add .`).
2. Run `diffscribe`:

```bash
npx diffscribe [--model=<model_name>] [--modelTemperature=<temperature_value>] [--commitLength=<length>]
```

### Options:

-   `--model`: The OpenAI model to use. Supported models are `gpt-4` and `gpt-3.5-turbo`. The default is `gpt-4`.
-   `--modelTemperature`: The temperature setting for the OpenAI model. The default is `0.05`. Use it to control the randomness of the generated commit message. It should be between `0` and `2`.
-   `--commitLength`: The maximum length of the generated commit message. It should be between 50 and 500 characters. The default is `50`. It is not an actual limit but rather a guideline to the model.

### Example:

```bash
npx diffscribe

It seems like you've made a lot of changes, including adding a new package 'diffscribe', modifying several package.json files, and updating documentation. Could you please clarify what you're trying to achieve with this commit?

Answer: I added a new package named `diffscribe`. Rewrite readme and improve documentation for all public packages. Rewrite TSDoc in `@neshca/json-replacer-reviver` package

Based on the information provided, the commit message could be: "Add diffscribe package and improve documentation".
```

What happened behind the scenes:

-   `diffscribe` will run `git status --renames` and `git diff --cached --stat` to get the branch name, list of changed files, and the number of changes in each file. It does not look inside the files.
-   This information is sent to OpenAI's API, along with the context and guidelines for the GPT model.
-   GPT will try to understand the changes and prompt the user to confirm its understanding.
-   GPT will generate a commit message if the user confirms the understanding.

## Notes:

-   Ensure you have the `.env` file in the same directory from which you are running `diffscribe`.
-   If you encounter errors related to model selection, temperature, or commit length, please check the passed arguments for validity.

## Developing and contributing

[Developing and contributing `diffscribe`](../../docs/contributing/diffscribe.md)

## License:

[MIT](./LICENSE)
