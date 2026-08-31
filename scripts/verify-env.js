const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

function run() {
  console.log("Running Environment Safety Verification...");

  // Verify that git status doesn't have committed sensitive files
  try {
    const gitStatus = execSync(
      "git ls-files --others --exclude-standard",
    ).toString();
    const untracked = gitStatus.split("\n").filter(Boolean);

    // Also check tracked files just in case
    const trackedFiles = execSync("git ls-files")
      .toString()
      .split("\n")
      .filter(Boolean);
    const allFiles = [...untracked, ...trackedFiles];

    const sensitivePatterns = [
      /^\.env$/,
      /^\.env\.(?!example).+/, // allow .env.example
      /node_modules/,
      /dist/,
      /pgdata/,
      /\.log$/,
    ];

    let violations = [];
    for (const file of allFiles) {
      for (const pattern of sensitivePatterns) {
        if (pattern.test(file)) {
          violations.push(file);
        }
      }
    }

    if (violations.length > 0) {
      console.error(
        "❌ SECURITY VIOLATION: Sensitive or ignored files are tracked or untracked but not ignored:",
      );
      violations.forEach((v) => console.error(`  - ${v}`));
      process.exit(1);
    }

    console.log("✅ Environment safety verified.");
  } catch (err) {
    console.error("Failed to run git commands", err);
    process.exit(1);
  }
}

run();
