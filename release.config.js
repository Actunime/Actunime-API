module.exports = {
  repositoryUrl: 'https://github.com/Actunime/Actunime-API',
  branches: ['production', 'beta'],
  plugins: [
    [
      '@semantic-release/commit-analyzer',
      {
        preset: 'angular',
        releaseRules: [
          { breaking: true, release: 'major' },
          { revert: true, release: 'patch' },
          // Angular
          { type: 'feat', release: 'minor' },
          { type: 'fix', release: 'patch' },
          { type: 'perf', release: 'patch' },
          // Custom
          {
            type: 'correction',
            release: 'patch'
          },
          {
            type: 'lint',
            release: 'patch'
          },
          {
            type: 'config',
            release: 'patch'
          },
          {
            type: 'docs',
            scope: 'README',
            release: 'patch'
          },
          {
            type: 'chore',
            release: 'patch'
          }
        ],
        parserOpts: {
          noteKeywords: ['BREAKING CHANGE', 'BREAKING CHANGES', 'BREAKING']
        }
      }
    ],
    [
      '@semantic-release/release-notes-generator',
      {
        /*  
                    use conventionalcommits instead of conventional-changelog-angular (default)
                    to introduce new sections in changelog
                */
        preset: 'conventionalcommits',
        presetConfig: {
          types: [
            { type: 'feat', section: 'Features', hidden: false },
            { type: 'fix', section: 'Bug Fixes', hidden: false },
            { type: 'docs', section: 'Miscellaneous Chores', hidden: false },
            { type: 'chore', section: 'Miscellaneous Chores', hidden: false }
          ]
        },
        parserOpts: {
          noteKeywords: ['BREAKING CHANGE', 'BREAKING CHANGES', 'BREAKING']
        }
      }
    ],
    [
      '@semantic-release/npm',
      {
        npmPublish: false
      }
    ],
    [
      '@semantic-release/changelog',
      {
        changelogFile: 'CHANGELOG.md'
      }
    ],
    '@semantic-release/github'
  ]
};
