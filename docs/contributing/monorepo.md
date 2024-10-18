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
npm run build:packages
```

### 3. Installing Local Dependencies

After building the project, you'll need to install the local dependencies to enable their usage from the command line:

```bash
npm i
```

**Note**: Don't be alarmed if you notice updates in the `package-lock.json` file after this step. These changes are expected and can be safely committed to your version control.

### 4. Running Tests locally

Refer to the [`@neshca/cache-handler` contribution guidelines](./cache-handler.md)

## Contribution Guidelines

To ensure consistent and high-quality code, adhere to our coding and style guidelines. Run the required checks and fix errors and warnings before committing your code:

```bash
npm run codestyle:fix
```
