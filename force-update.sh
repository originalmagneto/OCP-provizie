#!/bin/bash

echo "Checking current status..."
git status

echo "Adding all files, including untracked ones..."
git add -A

echo "Committing all changes..."
git commit -m "Force update all files, including untracked ones"

echo "Creating new branch with all local changes..."
git checkout -b force_update_branch

echo "Force pushing new branch to GitHub..."
git push -f origin force_update_branch

echo "Merging force_update_branch into main..."
git checkout main
git merge -X theirs force_update_branch -m "Merge force_update_branch, overwriting main"

echo "Force pushing updated main branch to GitHub..."
git push -f origin main

echo "Force update complete. Main branch on GitHub now matches your local state."
# Check if there are any ignored files
if [ -n "$(git ls-files --others --ignored --exclude-standard)" ]; then
    echo "Adding ignored files..."
    git add -f .
    git commit -m "Include ignored files in force update"
fi
