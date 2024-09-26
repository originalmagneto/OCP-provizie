#!/bin/bash

set -e  # Exit immediately if a command exits with a non-zero status.

# Function to increment version
increment_version() {
    local version=$1
    local release_type=$2
    IFS='.' read -ra ADDR <<< "$version"
    case $release_type in
        major)
            ADDR[0]=$((ADDR[0]+1))
            ADDR[1]=0
            ADDR[2]=0
            ;;
        minor)
            ADDR[1]=$((ADDR[1]+1))
            ADDR[2]=0
            ;;
        patch|*)
            ADDR[2]=$((ADDR[2]+1))
            ;;
    esac
    echo "${ADDR[*]}" | sed 's/ /./g'
}

echo "Ensuring we're on the main branch..."
git checkout main || { echo "Failed to checkout main branch"; exit 1; }

echo "Stashing local changes..."
git stash

echo "Pulling latest changes..."
git fetch origin main
git reset --hard origin/main || { echo "Failed to reset to origin/main"; exit 1; }

echo "Applying stashed changes..."
git stash pop || true  # Don't fail if there's nothing to pop

echo "Getting the latest tag..."
LATEST_TAG=$(git describe --tags --abbrev=0 2>/dev/null)

if [[ -z "$LATEST_TAG" ]]; then
    NEW_VERSION="0.0.1"
else
    VERSION_NUMBER=${LATEST_TAG#v}
    RELEASE_TYPE=${RELEASE_TYPE:-patch}
    NEW_VERSION=$(increment_version $VERSION_NUMBER $RELEASE_TYPE)
fi

CURRENT_VERSION=$(node -p "require('./package.json').version")

if [[ "$NEW_VERSION" == "$CURRENT_VERSION" ]]; then
    echo "Version $NEW_VERSION is already the current version. Incrementing..."
    NEW_VERSION=$(increment_version $CURRENT_VERSION patch)
fi

echo "Preparing release v$NEW_VERSION"

echo "Generating changelog..."
CHANGELOG=$(git log $(git describe --tags --abbrev=0 2>/dev/null)..HEAD --pretty=format:"- %s")

# Generate structured comment (as before)

echo "Updating package.json version..."
npm version $NEW_VERSION --no-git-tag-version || { echo "Failed to update package.json version"; exit 1; }

echo "Updating package-lock.json..."
npm install --package-lock-only

echo "Adding all changes..."
git add . || { echo "Failed to add changes"; exit 1; }

echo "Committing changes..."
git commit -m "Release v$NEW_VERSION

$STRUCTURED_COMMENT

Changelog:
$CHANGELOG" || { echo "Failed to commit changes"; exit 1; }

echo "Creating new tag..."
git tag -a v$NEW_VERSION -m "Release v$NEW_VERSION

$STRUCTURED_COMMENT

Changelog:
$CHANGELOG" || { echo "Failed to create tag"; exit 1; }

echo "Pushing changes and tags to GitHub..."
git push origin main || { echo "Failed to push to main"; exit 1; }
git push origin v$NEW_VERSION || { echo "Failed to push tag"; exit 1; }

echo "Release v$NEW_VERSION has been created and pushed to GitHub"

echo "Release process completed successfully!"
