/**
 * @type {import('semantic-release').GlobalConfig}
 */
export default {
    branches: [
        "main"
    ],
    repositoryUrl: "https://github.com/Actunime/Actunime-API",
    plugins: [
        "@semantic-release/commit-analyzer",
        "@semantic-release/release-notes-generator",
        "@semantic-release/changelog",
        "@semantic-release/github",
        ["@semantic-release/git", {
            assets: ['package.json', 'CHANGELOG.md', 'pnpm-lock.yaml'],
            message: 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}'
        }
        ],
    ]
}