module.exports = {
    branches: ['production'],
    plugins: [
        '@semantic-release/commit-analyzer',
        '@semantic-release/release-notes-generator',
        '@semantic-release/npm',
        '@semantic-release/github'
    ],
    repositoryUrl: "https://github.com/Actunime/Actunime-API"
};