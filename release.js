const { execSync } = require('child_process');
const fs = require('fs');

try {
  // Get the new version
  const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  const newVersion = packageJson.version;

  // Generate changelog
  const changelog = execSync('git log $(git describe --tags --abbrev=0)..HEAD --pretty=format:"- %s"').toString();

  // Create GitHub release
  execSync(`gh release create v${newVersion} -t "Release ${newVersion}" -n "${changelog}"`, { stdio: 'inherit' });

  console.log(`Release v${newVersion} created successfully!`);
} catch (error) {
  console.error('Error creating release:', error);
  process.exit(1);
}
