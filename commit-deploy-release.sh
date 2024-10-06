#!/bin/bash

# Set Netlify deploy hook URL
NETLIFY_DEPLOY_HOOK="https://api.netlify.com/build_hooks/67023edfe04bcafc52857cab"

# Exit immediately if a command exits with a non-zero status
set -e
# Function to increment version
increment_version() {
    local version=$1
    IFS='.' read -ra ADDR <<< "$version"
    ADDR[2]=$((ADDR[2]+1))
    echo "${ADDR[0]}.${ADDR[1]}.${ADDR[2]}"
}

# Function to check if a tag exists
tag_exists() {
    git rev-parse $1 >/dev/null 2>&1
}

# Find the next available version
find_next_version() {
    local version=$1
    while tag_exists "v$version"; do
        version=$(increment_version $version)
    done
    echo $version
}

# Prompt for commit message
read -p "Enter commit message: " commit_message

# Add all changes
git add .

# Commit changes
git commit -m "$commit_message"

# Push to GitHub
git push origin main
# Get the latest tag
LATEST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "v0.0.0")

# Find the next available version
NEW_VERSION=$(find_next_version ${LATEST_TAG#v})

# Create new tag
git tag -a "v$NEW_VERSION" -m "Release v$NEW_VERSION"
# Push new tag
if ! git push origin "v$NEW_VERSION"; then
    echo "Failed to push tag v$NEW_VERSION"
    exit 1
fi

# Create GitHub release
if ! gh release create "v$NEW_VERSION" --title "Release v$NEW_VERSION" --notes "$commit_message"; then
    echo "Failed to create GitHub release v$NEW_VERSION"
    exit 1
fi

echo "Changes committed, pushed, and released as v$NEW_VERSION"

# Deploy to Render (adjust this command based on your Render setup)
echo "Deploying to Render..."
curl -X POST https://api.render.com/deploy/srv-cs040rrv2p9s73d2ud20?key=y-hEKElcG0U

echo "Deployment triggered. Check Render dashboard for status."
