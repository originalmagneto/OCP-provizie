#!/bin/bash

# Fetch all tags and commits
git fetch --all --tags

# Create a backup of the current main branch
git checkout main
git checkout -b backup-before-rollback

# Push the backup branch to remote
git push -u origin backup-before-rollback

# Switch back to main and reset it to v0.0.317
git checkout main
git reset --hard v0.0.317

# Force push the rolled-back main branch
git push -f origin main

# Create a new branch at this point for future development
git checkout -b development-after-v0.0.317

# Push the new development branch
git push -u origin development-after-v0.0.317

echo "Rollback to v0.0.317 completed. New development branch created."
