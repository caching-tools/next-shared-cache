#!/usr/bin/env node
// @ts-check

const core = require('@actions/core');
const { execSync } = require('child_process');
const { globSync } = require('glob');
const fs = require('fs');

try {
    const packagesPaths = globSync('packages/**/package.json', {
        absolute: true,
    });

    for (const packagePath of packagesPaths) {
        const packageData = fs.readFileSync(packagePath, 'utf8');
        const { name, version, private, distTags } = JSON.parse(packageData);

        if (!Array.isArray(distTags)) {
            continue;
        }

        if (private === true || private === 'true') {
            continue;
        }

        if (!name || !version) {
            continue;
        }

        for (const tag of distTags) {
            execSync(`npm dist-tag add ${name}@${version} ${tag}`, { stdio: 'inherit' });
        }
    }
} catch (error) {
    core.setFailed(error);
}
