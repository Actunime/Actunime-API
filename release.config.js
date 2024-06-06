module.exports = {
    branches: ['production'],
    plugins: [
        '@semantic-release/commit-analyzer',
        [
            '@semantic-release/git',
            {
                "assets": ["package.json"],
                "message": "chore(release): ${nextRelease.version} [skip ci]\\n\\n${nextRelease.notes}"
            }
        ]
    ],
    repositoryUrl: "https://github.com/Actunime/Actunime-API"
};