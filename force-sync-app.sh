#!/bin/bash



echo "Checking out main branch..."
git checkout main

echo "Adding app.js..."
git add -f app.js

echo "Committing app.js..."
git commit -m "Force sync app.js"

echo "Force pushing app.js to main branch on GitHub..."
git push -f origin main:main

echo "Force sync of app.js complete."
