#!/bin/bash

# Fetch the latest changes from the remote repository
git fetch origin

# Check if there are any uncommitted changes
if [[ $(git status --porcelain) ]]; then
    echo "You have uncommitted changes. Please commit or stash them before proceeding."
    exit 1
fi

# Switch to the main branch
git checkout main

# Reset the local main branch to match the remote main branch
git reset --hard origin/main

echo "Your local repository is now synced with the rolled-back version on GitHub."
echo "Current commit:"
git log --oneline -n 1

# Optionally, you can pull any new changes
echo "Pulling any new changes..."
git pull origin main

echo "Sync complete. Your local repository is now at the same state as the GitHub version."
