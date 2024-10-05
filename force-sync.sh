#!/bin/bash

# Add hidden files and directories
shopt -s dotglob

# Exclude .git and node_modules
GLOBIGNORE=".git:node_modules"

echo "Creating a temporary branch..."
git checkout -b temp_sync_branch

echo "Removing all files from Git tracking..."
git rm -r --cached .

echo "Adding all files back, including untracked and ignored ones..."
git add -A
git add -f .

echo "Committing all files..."
git commit -m "Sync all files with local directory"

echo "Force pushing temporary branch to GitHub..."
git push -f origin temp_sync_branch

echo "Switching back to main branch..."
git checkout main

echo "Merging temporary branch into main, preferring temp_sync_branch changes..."
git merge -X theirs temp_sync_branch -m "Merge temp_sync_branch, syncing with local directory"

echo "Force pushing main branch to GitHub..."
git push -f origin main

echo "Cleaning up: Deleting temporary branch..."
git branch -D temp_sync_branch
git push origin --delete temp_sync_branch

echo "Sync complete. Main branch on GitHub now matches your local directory."
