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

# Install project dependencies
npm ci

# Install serverless-http specifically
npm install serverless-http

# If you have any additional build steps, add them here

echo "Dependencies installed successfully"
echo "Build completed successfully"
