module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat", // New feature
        "fix", // Bug fix
        "docs", // Documentation only changes
        "style", // Formatting, missing semi colons, etc
        "refactor", // Code change that neither fixes a bug nor adds a feature
        "perf", // Performance improvements
        "test", // Adding missing tests
        "chore", // Maintain, dependencies, config
        "revert", // Revert a previous commit
        "build", // Changes to build system or dependencies
        "ci", // CI/CD changes
      ],
    ],
  },
};
