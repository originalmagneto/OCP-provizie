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

# Get the current branch name
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

# Rename the current branch to main
git branch -m $CURRENT_BRANCH main

# Force push the new main branch
git push origin main --force

# Delete the old branch on remote if it exists and is not main
if [ "$CURRENT_BRANCH" != "main" ]; then
    git push origin :$CURRENT_BRANCH || true
fi

# Set the local main branch to track the remote main branch
git branch --set-upstream-to=origin/main main

# Get all tags from the remote
git fetch --tags

# Find the latest tag
LATEST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "v0.5.30")

# Increment version
NEW_VERSION=$(increment_version ${LATEST_TAG#v})

# Prompt for commit message
read -p "Enter commit message: " commit_message

# Add all changes
git add .

# Commit changes
git commit -m "$commit_message"

# Push to GitHub
git push origin main

# Create new tag
git tag -a "v$NEW_VERSION" -m "Release v$NEW_VERSION"

# Push new tag
git push origin "v$NEW_VERSION"

# Create GitHub release
gh release create "v$NEW_VERSION" --title "Release v$NEW_VERSION" --notes "$commit_message"

echo "Changes committed, pushed, and released as v$NEW_VERSION"

# Deploy to Render (adjust this command based on your Render setup)
echo "Deploying to Render..."
curl -X POST https://api.render.com/deploy/srv-cs040rrv2p9s73d2ud20?key=y-hEKElcG0U

echo "Deployment triggered. Check Render dashboard for status."

echo "The current branch ($CURRENT_BRANCH) has been renamed to main and is now the primary branch."
