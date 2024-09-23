#!/bin/bash

# Check if a version number was provided
if [ -z "$1" ]; then
    echo "Please provide a version number (e.g., ./release.sh v0.0.1)"
    exit 1
fi

VERSION=$1

# Ensure we're on the main branch
git checkout main

# Pull the latest changes
git pull origin main

# Add all changes
git add .

# Commit changes
git commit -m "Release $VERSION"

# Create a new tag
git tag -a $VERSION -m "Release $VERSION"

# Push changes and tags to GitHub
git push origin main
git push origin $VERSION

echo "Release $VERSION has been created and pushed to GitHub"
