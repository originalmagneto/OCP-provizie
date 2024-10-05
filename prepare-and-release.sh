#!/bin/bash

set -e

# Function to handle merge conflicts
handle_merge_conflicts() {
    echo "Merge conflicts detected. Please follow these steps:"
    echo "1. Open the conflicting files and resolve the conflicts manually."
    echo "2. After resolving conflicts, stage the changes:"
    echo "   git add ."
    echo "3. Commit the merged changes:"
    echo "   git commit -m 'Resolve merge conflicts'"
    echo "4. Then run this script again."
    exit 1
}

# Fetch the latest changes
git fetch origin

# Check if there are diverged branches
if [ "$(git rev-parse HEAD)" != "$(git rev-parse origin/main)" ]; then
    echo "Local and remote branches have diverged. Attempting to merge..."
    if ! git merge --no-commit --no-ff origin/main; then
        handle_merge_conflicts
    fi
fi

# Check for unresolved conflicts
if [[ -n $(git ls-files -u) ]]; then
    handle_merge_conflicts
fi

# Function to run the release script only once
run_release_once() {
    if [ ! -f ".release_lock" ]; then
        touch .release_lock
        ./release.sh
        rm .release_lock
    else
        echo "Release process is already running. Skipping additional release."
    fi
}

# Replace direct call to release.sh with this function
alias release_script=run_release_once

# Check if app.js has changed
echo "Checking app.js status..."
if git diff --quiet HEAD^..HEAD -- app.js; then
    echo "No changes detected in app.js."
else
    echo "Changes detected in app.js. These changes will be included in the release."
fi

# Function to handle merge conflicts
handle_merge_conflicts() {
    echo "Merge conflicts detected. Please resolve them manually."
    echo "After resolving conflicts, run the following commands:"
    echo "1. git add ."
    echo "2. git commit -m 'Resolve merge conflicts'"
    echo "3. Run this script again"
    exit 1
}

# Fetch the latest changes
git fetch origin

# Check if there are diverged branches
if [ "$(git rev-parse HEAD)" != "$(git rev-parse origin/main)" ]; then
    echo "Local and remote branches have diverged. Attempting to merge..."
    git merge --no-commit --no-ff origin/main
    if [ $? -ne 0 ]; then
        handle_merge_conflicts
    fi
fi

# Check for unresolved conflicts
if [[ -n $(git ls-files -u) ]]; then
    handle_merge_conflicts
fi

# Ensure we're on the main branch
git checkout main

# Fetch the latest changes
git fetch origin

# Check if there are diverged branches
if [ "$(git rev-parse HEAD)" != "$(git rev-parse origin/main)" ]; then
    echo "Local and remote branches have diverged. Attempting to merge..."
    git merge --no-commit --no-ff origin/main
    if [ $? -ne 0 ]; then
        echo "Automatic merge failed. Please resolve conflicts manually, then run the script again."
        exit 1
    fi
fi

# Stage all changes, including untracked files
git add -A

# Check if there are any changes to commit
if [[ -n $(git diff --cached --exit-code) ]]; then
    echo "Changes detected. These will be included in the release commit."
else
    echo "No changes detected. Proceeding with release."
fi

# Fetch the latest changes from the remote repository
git fetch origin

# Check if there are diverged branches
if [ "$(git rev-parse HEAD)" != "$(git rev-parse origin/main)" ]; then
    echo "Local and remote branches have diverged. Attempting to merge..."
    git pull --no-edit
    if [ $? -ne 0 ]; then
        echo "Automatic merge failed. Please resolve conflicts manually, then run the script again."
        exit 1
    fi
fi

# Check for local changes
if [[ $(git status --porcelain) ]]; then
    echo "You have local changes. Committing..."
    git add .
    git commit -m "Update files before release"
fi

# Push local changes
git push origin main
if [ $? -ne 0 ]; then
    echo "Failed to push changes. Please pull the latest changes, resolve any conflicts, and try again."
    exit 1
fi

# Check for unpushed commits
if [[ -n $(git log origin/main..HEAD) ]]; then
    echo "Unpushed commits found. Pushing to GitHub..."
    git push origin main
    echo "Commits pushed to GitHub."
else
    echo "No unpushed commits found."
fi

# Force add important files
git add -f app.js prepare-and-release.sh release.sh backup-and-sync.sh

# Check if there are changes to commit
if [[ $(git status --porcelain) ]]; then
    echo "Changes detected in important files. Committing..."
    git commit -m "Update app.js and script files"
    git push origin main
    echo "Changes committed and pushed."
else
    echo "No changes detected in important files."
fi

# Sync with GitHub
git fetch origin
git checkout main
git reset --hard origin/main

echo "Local repository synced with GitHub."

# Check for local changes
if [[ $(git status --porcelain) ]]; then
    echo "You have local changes. Please review them."
    git status
    read -p "Do you want to commit these changes? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]
    then
        git add .
        read -p "Enter commit message: " commit_message
        git commit -m "$commit_message"
        git push origin main
        echo "Changes committed and pushed."
    else
        echo "Changes not committed. Exiting."
        exit 1
    fi
fi

# Run the release script
echo "Running release script..."
./release.sh

echo "Release process completed."

# Ensure app.js changes are pushed
echo "Checking app.js status..."
if [[ $(git status --porcelain app.js) ]]; then
    echo "Changes detected in app.js. Committing and pushing..."
    git add app.js
    git commit -m "Update app.js with latest changes"
    git push origin main
    echo "app.js changes committed and pushed."
else
    echo "No changes detected in app.js."
fi

# Final check for any remaining changes
git status
