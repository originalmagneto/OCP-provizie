#!/bin/bash

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
