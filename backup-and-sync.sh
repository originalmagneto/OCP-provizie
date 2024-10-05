#!/bin/bash

# Create backup branch
git fetch origin
git branch backup-branch origin/main
git push origin backup-branch

# Sync local changes to main
git checkout main
git add .
git commit -m "Sync all local changes to main"
git push -f origin main

echo "Backup created as 'backup-branch' and local changes synced to main."
echo "If you need to revert, run:"
echo "git checkout backup-branch"
echo "git branch -f main backup-branch"
echo "git push -f origin main"
