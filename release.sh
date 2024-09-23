#!/bin/bash

# Function to increment version
increment_version() {
    local version=$1
    local position=$2
    IFS='.' read -ra ADDR <<< "$version"
    for i in "${!ADDR[@]}"; do
        if [[ $i -eq $position ]]; then
            ADDR[$i]=$((ADDR[$i]+1))
        elif [[ $i -gt $position ]]; then
            ADDR[$i]=0
        fi
    done
    echo "${ADDR[*]}" | sed 's/ /./g'
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
    NEW_VERSION="v$(increment_version $VERSION_NUMBER 2)"
fi

echo "Preparing release $NEW_VERSION"

# Generate changelog
CHANGELOG=$(git log $(git describe --tags --abbrev=0 2>/dev/null)..HEAD --pretty=format:"- %s")

# Check if there are any changes to commit
if [[ -z $(git status -s) ]]; then
    echo "No changes to commit. Aborting release."
    exit 1
fi

# Prompt for a custom comment
echo "Please enter a comment describing the nature of the changes:"
read -e CUSTOM_COMMENT

# Add all changes
git add .

# Commit changes
git commit -m "Release $NEW_VERSION

$CUSTOM_COMMENT

Changelog:
$CHANGELOG"

# Create a new tag
git tag -a $NEW_VERSION -m "Release $NEW_VERSION

$CUSTOM_COMMENT

Changelog:
$CHANGELOG"

# Push changes and tags to GitHub
git push origin main
git push origin $NEW_VERSION

# Create GitHub release
gh release create $NEW_VERSION -t "Release $NEW_VERSION" -n "$CUSTOM_COMMENT

Changelog:
$CHANGELOG"

echo "Release $NEW_VERSION has been created and pushed to GitHub"

# Update package.json version (if it exists)
if [[ -f "package.json" ]]; then
    npm version $NEW_VERSION --no-git-tag-version
    git add package.json
    git commit -m "Bump version in package.json to $NEW_VERSION"
    git push origin main
fi

echo "Release process completed successfully!"
