module.exports = {
  extends: ['@commitlint/config-conventional'],
  ignores: [
    // dependabot
    (message) => /chore\(deps(?:-dev)?\): bump/.test(message),

    // semantic-release
    (message) => /chore\(release\):/.test(message),
  ],
};
