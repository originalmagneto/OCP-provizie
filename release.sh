#!/bin/bash

# Function to increment version
increment_version() {
    local version=$1
    IFS='.' read -ra ADDR <<< "$version"
    ADDR[2]=$((ADDR[2]+1))
    echo "${ADDR[0]}.${ADDR[1]}.${ADDR[2]}"
}

# Ensure we're on the main branch
git checkout main

# Pull the latest changes
git pull origin main

# Get the latest tag
LATEST_TAG=$(git describe --tags --abbrev=0 2>/dev/null)

if [[ -z "$LATEST_TAG" ]]; then
    NEW_VERSION="v0.0.1"
else
    # Remove 'v' prefix for version calculation
    VERSION_NUMBER=${LATEST_TAG#v}
    NEW_VERSION="v$(increment_version $VERSION_NUMBER)"
fi

echo "Preparing release $NEW_VERSION"

# Generate changelog
CHANGELOG=$(git log $(git describe --tags --abbrev=0 2>/dev/null)..HEAD --pretty=format:"- %s")

# Check if there are any changes to commit
if [[ -z $(git status -s) ]]; then
    echo "No changes detected. Creating release without new commit."
    # Generate automatic comment for no changes
    AUTO_COMMENT="This is a maintenance release with no code changes.

For more details, please refer to the full changelog."
else
    # Generate automatic comment for changes
    AUTO_COMMENT="This release includes the following changes:

$CHANGELOG

For more details, please refer to the full changelog."

    # Add all changes
    git add .

    # Commit changes
    git commit -m "Release $NEW_VERSION

$AUTO_COMMENT"
fi

# Prompt for additional custom comment
echo "An automatic comment has been generated. Would you like to add any additional comments? (Press Enter to skip)"
read -e CUSTOM_COMMENT

# Combine automatic and custom comments
FULL_COMMENT="$AUTO_COMMENT

Additional notes:
$CUSTOM_COMMENT"

# Create a new tag or update existing one
git tag -f $NEW_VERSION -m "Release $NEW_VERSION

$FULL_COMMENT"

# Push changes and tags to GitHub
git push origin main
git push -f origin $NEW_VERSION

# Create or update GitHub release
gh release create $NEW_VERSION --title "Release $NEW_VERSION" --notes "$FULL_COMMENT" --target main || gh release edit $NEW_VERSION --title "Release $NEW_VERSION" --notes "$FULL_COMMENT"

echo "Release $NEW_VERSION has been created and pushed to GitHub"

# Update package.json version (if it exists)
if [[ -f "package.json" ]]; then
    npm version $NEW_VERSION --no-git-tag-version
    git add package.json
    git commit -m "Bump version in package.json to $NEW_VERSION"
    git push origin main
fi

echo "Release process completed successfully!"
