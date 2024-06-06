module.exports = {
    // branches: ['production'],
    // plugins: [
    //     '@semantic-release/commit-analyzer',
    //     [
    //         '@semantic-release/git',
    //         {
    //             "assets": ["package.json"],
    //             "message": "chore(release): ${nextRelease.version} [skip ci]\\n\\n${nextRelease.notes}"
    //         }
    //     ]
    // ],
    repositoryUrl: "https://github.com/Actunime/Actunime-API",
    branches: ["production", "beta"],
    plugins: [
        [
            "@semantic-release/commit-analyzer",
            {
                preset: "angular",
                releaseRules: [
                    {
                        breaking: true,
                        release: "major",
                    },
                    {
                        type: "feat",
                        release: "minor",
                    },
                    {
                        type: "fix",
                        release: "patch",
                    },
                    {
                        type: "docs",
                        scope: "README",
                        release: "patch",
                    },
                    {
                        type: "chore",
                        release: "patch",
                    }
                ],
                parserOpts: {
                    noteKeywords: ["BREAKING CHANGE", "BREAKING CHANGES", "BREAKING"],
                },
            },
        ],
        [
            "@semantic-release/release-notes-generator",
            {
                /*  
                    use conventionalcommits instead of conventional-changelog-angular (default)
                    to introduce new sections in changelog
                */
                preset: "conventionalcommits",
                presetConfig: {
                    types: [
                        { type: "feat", section: "Features", hidden: false },
                        { type: "fix", section: "Bug Fixes", hidden: false },
                        { type: "docs", section: "Miscellaneous Chores", hidden: false },
                        { type: "chore", section: "Miscellaneous Chores", hidden: false },
                    ],
                },
                parserOpts: {
                    noteKeywords: ["BREAKING CHANGE", "BREAKING CHANGES", "BREAKING"],
                },
            },
        ],
        [
            "@semantic-release/npm", {
                npmPublish: false
            }
        ],
    ],
};