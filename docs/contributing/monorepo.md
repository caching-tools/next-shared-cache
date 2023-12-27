## Development Setup

If you're interested in contributing or making modifications to this monorepo, follow the steps below to set it up for development:

### 1. Install Dependencies

To ensure that all required packages are correctly installed with the versions specified in the `package-lock.json` file, execute:

```bash
npm ci
```

### 2. Build the Project

After the dependencies are installed, compile internal dependencies with:

```bash
npm run build
```

### 3. Installing Local Dependencies

After building the project, you'll need to install the local dependencies to enable their usage from the command line:

```bash
npm run i
```

**Note**: Don't be alarmed if you notice updates in the `package-lock.json` file after this step. These changes are expected and can be safely committed to your version control.

### 4. Running Tests locally

Install `act` globally using the official [installation instructions](https://github.com/nektos/act?tab=readme-ov-file#installation-through-package-managers).

Create a `.actrc` file in the root of the project with the following contents:

```bash
-e .act.json
```

Then, create `.act.json` file near the `.actrc` file with the following contents:

```json
{
    "act": true
}
```

Finally, run the tests locally with:

```bash
act pull_request
```

## Contribution Guidelines

To maintain code consistency and quality, follow our coding and style guidelines. Run required checks before committing:

### 1. Code Formatting

Maintaining a uniform code style throughout the project is essential. Use the command below to format your code according to our standards automatically:

```bash
npm run format
```

### 2. Lint Checks

Linting identifies common errors and enforces our coding standards. Ensure your changes meet our lint checks with the following:

```bash
npm run lint
```

Your adherence to these guidelines assists in maintaining a high-quality and consistent codebase. I appreciate your contributions!
