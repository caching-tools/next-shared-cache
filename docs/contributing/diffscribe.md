## Developing

Before diving into development, setting up the monorepo environment is essential. Please follow the instructions in the [monorepo setup guide](./monorepo.md) to ensure you start on the right foot.

### Running `diffscribe` locally

Once the monorepo is correctly set up, you can develop `diffscribe`. To run `diffscribe` locally and see your changes in real time, use the following command:

```bash
npm run dev -w diffscribe
```

Create a `.env` file in the root of the monorepo and add the following:

```bash
OPENAI_API_KEY=your_openai_api_key
```

Remember to replace `your_openai_api_key` with your actual OpenAI API key.

### Obtaining an OpenAI API Key

If you don't have an OpenAI API key, follow these steps to obtain one:

1. Visit [OpenAI API section](https://platform.openai.com/account/api-keys/).
2. Register for an account or sign in if you already have one.
3. Follow the prompts to create a new API key.
4. Once you have your API key, copy and paste it into the `.env` file where it says `your_openai_api_key`.

**Important**: Treat your API key as confidential. Please do not share it or commit it directly to the repository.

Thank you for contributing, and happy coding!
