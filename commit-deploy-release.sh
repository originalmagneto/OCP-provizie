#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Function to increment version
increment_version() {
    local version=$1
    IFS='.' read -ra ADDR <<< "$version"
    ADDR[2]=$((ADDR[2]+1))
    echo "${ADDR[0]}.${ADDR[1]}.${ADDR[2]}"
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

# Increment version
NEW_VERSION=$(increment_version ${LATEST_TAG#v})

# Create new tag
git tag -a "v$NEW_VERSION" -m "Release v$NEW_VERSION"

# Push new tag
git push origin "v$NEW_VERSION"

# Create GitHub release
gh release create "v$NEW_VERSION" --title "Release v$NEW_VERSION" --notes "$commit_message"

echo "Changes committed, pushed, and released as v$NEW_VERSION"

# Deploy to Netlify using a deploy hook
echo "Deploying to Netlify..."
curl -X POST -d {} https://api.netlify.com/build_hooks/67023edfe04bcafc52857cab

echo "Deployment triggered. Check Netlify dashboard for status."
