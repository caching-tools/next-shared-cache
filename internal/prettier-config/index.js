const config = require('@vercel/style-guide/prettier');

module.exports = {
    ...config,
    tabWidth: 4,
    printWidth: 120,
    singleQuote: true,
    overrides: [
        {
            files: '*.{yml,yaml}',
            options: {
                tabWidth: 2,
            },
        },
    ],
};
