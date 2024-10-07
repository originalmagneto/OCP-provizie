#!/bin/bash

# Netlify build script

# Exit immediately if a command exits with a non-zero status
set -e

# Print commands and their arguments as they are executed
set -x

# Install dependencies
npm install

# Build the project (if necessary)
# npm run build

# If you have any additional build steps, add them here

echo "Build completed successfully"
