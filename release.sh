#!/bin/bash

# Function to increment version
increment_version() {
    local version=$1
    local major minor patch

    IFS='.' read -r major minor patch <<< "$version"
    patch=$((patch + 1))

    echo "$major.$minor.$patch"
}

# Get the latest tag
latest_tag=$(git describe --tags --abbrev=0 2>/dev/null)

if [ -z "$latest_tag" ]; then
    VERSION="v0.0.1"
else
    VERSION=$(increment_version "${latest_tag#v}")
    VERSION="v$VERSION"
fi

echo "Preparing release $VERSION"

# Ensure we're on the main branch
git checkout main || { echo "Failed to checkout main branch"; exit 1; }

# Pull the latest changes
git pull origin main || { echo "Failed to pull latest changes"; exit 1; }

# Generate changelog
echo "Generating changelog..."
echo "# Changelog for $VERSION" > CHANGELOG.md
git log $(git describe --tags --abbrev=0)..HEAD --pretty=format:"* %s" >> CHANGELOG.md

# Add all changes
git add .

# Commit changes
git commit -m "Release $VERSION" || { echo "No changes to commit"; exit 1; }

# Create a new tag
git tag -a $VERSION -m "Release $VERSION"

# Push changes and tags to GitHub
git push origin main && git push origin $VERSION

echo "Release $VERSION has been created and pushed to GitHub"
