#!/usr/bin/env node
// @ts-check

const core = require('@actions/core');
const { execSync } = require('child_process');
const { globSync } = require('glob');
const fs = require('fs');

function run() {
    try {
        const published = core.getInput('published', { required: true });

        if (published !== 'true') {
            core.debug('Not published');

            return;
        }

        const publishedPackagesInput = core.getInput('publishedPackages', { required: false });

        /** @type {{ name: string; version: string }[]} */
        const publishedPackages = JSON.parse(publishedPackagesInput || '[]');

        if (!Array.isArray(publishedPackages) || publishedPackages.length === 0) {
            core.debug('No published packages found');

            return;
        }

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

            const package = publishedPackages.find((pkg) => pkg.name === name);

            if (!package) {
                continue;
            }

            for (const tag of distTags) {
                execSync(`npm dist-tag add ${package.name}@${package.version} ${tag}`, { stdio: 'inherit' });
            }
        }
    } catch (error) {
        core.setFailed(error);
    }
}

run();
