#!/bin/bash

# Prevent additional commit for version bump
VERSION_BUMP_COMMIT=false


# Prevent additional commit for version bump
VERSION_BUMP_COMMIT=false

set -e

# Function to increment version
increment_version() {
    local version=$1
    IFS='.' read -ra ADDR <<< "$version"
    ADDR[2]=$((ADDR[2]+1))
    echo "${ADDR[0]}.${ADDR[1]}.${ADDR[2]}"
}

# Function to generate changelog
generate_changelog() {
    local since_tag=$1
    local changes=$(git log ${since_tag}..HEAD --pretty=format:"%h - %s (%an)")
    local changelog=""

    while IFS= read -r line; do
        cleaned_line=$(echo "$line" | sed -E 's/^[a-f0-9]+ - (\[?[A-Z]+-[0-9]+\]?:?|fix:|feat:|refactor:|chore:|docs:)//' | sed 's/^ *//')
        cleaned_line="$(tr '[:lower:]' '[:upper:]' <<< ${cleaned_line:0:1})${cleaned_line:1}"
        changelog+="- $cleaned_line\n"
    done <<< "$changes"

    echo -e "$changelog"
}

# Error handling function
handle_error() {
    echo "Error: $1" >&2
    exit 1
}

# Ensure we're on the main branch and up to date
git checkout main
git pull origin main

# Fetch all tags
git fetch --tags

# Get the latest tag and prepare new version
LATEST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "v0.0.0")
VERSION_NUMBER=${LATEST_TAG#v}
NEW_VERSION="v$(increment_version $VERSION_NUMBER)"

# Ensure unique version
while git rev-parse $NEW_VERSION >/dev/null 2>&1; do
    VERSION_NUMBER=${NEW_VERSION#v}
    NEW_VERSION="v$(increment_version $VERSION_NUMBER)"
done

echo "Preparing release $NEW_VERSION"

# Generate changelog
CHANGELOG=$(generate_changelog $LATEST_TAG)

# Exit if no changes
if [[ -z "$CHANGELOG" ]]; then
    echo "No changes detected since last release. Skipping release process."
    exit 0
fi

# Update package.json version
npm version $NEW_VERSION --no-git-tag-version

# Stage all changes, including package.json
git add .

# Commit changes with changelog
git commit -m "Release $NEW_VERSION

$CHANGELOG"

# Create and push tag
git tag -a $NEW_VERSION -m "Release $NEW_VERSION

$CHANGELOG"
git push origin main --tags

# Create GitHub release
gh release create $NEW_VERSION --title "Release $NEW_VERSION" --notes "$CHANGELOG" --target main

echo "Release $NEW_VERSION has been created and pushed to GitHub"

set -e

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

# Fetch all tags
git fetch --tags

# Get the latest tag
LATEST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "v0.0.0")

# Remove 'v' prefix for version calculation
VERSION_NUMBER=${LATEST_TAG#v}
NEW_VERSION="v$(increment_version $VERSION_NUMBER)"

# Check if the new version tag already exists and keep incrementing until we find a unique version
while git rev-parse $NEW_VERSION >/dev/null 2>&1; do
    echo "Tag $NEW_VERSION already exists. Incrementing..."
    VERSION_NUMBER=${NEW_VERSION#v}
    NEW_VERSION="v$(increment_version $VERSION_NUMBER)"
done

echo "Preparing release $NEW_VERSION"

# Generate a more descriptive changelog
generate_changelog() {
    local since_tag=$1
    local changes=$(git log ${since_tag}..HEAD --pretty=format:"%h - %s (%an)")
    local changelog=""

    while IFS= read -r line; do
        # Remove any issue numbers or technical prefixes
        cleaned_line=$(echo "$line" | sed -E 's/^[a-f0-9]+ - (\[?[A-Z]+-[0-9]+\]?:?|fix:|feat:|refactor:|chore:|docs:)//' | sed 's/^ *//')

        # Capitalize the first letter
        cleaned_line="$(tr '[:lower:]' '[:upper:]' <<< ${cleaned_line:0:1})${cleaned_line:1}"

        # Add bullet point
        changelog+="- $cleaned_line\n"
    done <<< "$changes"

    echo -e "$changelog"
}

CHANGELOG=$(generate_changelog $LATEST_TAG)

# Check if there are any changes to commit
if [[ -z "$CHANGELOG" ]]; then
    echo "No changes detected since last release. Skipping release process."
    exit 0
fi

# Generate automatic comment
AUTO_COMMENT="This release includes the following changes:

$CHANGELOG

For more details, please refer to the full commit history."

# Combine automatic and custom comments
FULL_COMMENT="$AUTO_COMMENT"

# Create a new tag
git tag -a $NEW_VERSION -m "Release $NEW_VERSION

$FULL_COMMENT"

# Push tag to GitHub
git push origin $NEW_VERSION

# Create GitHub release
gh release create $NEW_VERSION --title "Release $NEW_VERSION" --notes "$FULL_COMMENT" --target main

echo "Release $NEW_VERSION has been created and pushed to GitHub"

# Update package.json version (if it exists)
if [[ -f "package.json" ]]; then
    npm version $NEW_VERSION --no-git-tag-version
    git add package.json
    git commit -m "Bump version in package.json to $NEW_VERSION"
    git push origin main
fi

echo "Release process completed successfully!"
