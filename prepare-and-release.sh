#!/bin/bash

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
