set -e  # Exit immediately if a command exits with a non-zero status.

# Function to increment version
increment_version() {
    local version=$1
    local position=$2
    IFS='.' read -ra ADDR <<< "$version"
    for i in "${!ADDR[@]}"; do
        if [[ $i -eq $position ]]; then
            ADDR[$i]=$((ADDR[$i]+1))
        elif [[ $i -gt $position ]]; then
            ADDR[$i]=0
        fi
    done
    echo "${ADDR[*]}" | sed 's/ /./g'
}

# Function to generate a structured comment
generate_structured_comment() {
    local changes=$(git diff --name-only HEAD)
    local comment="# Release Notes\n\n## Changes in this version:\n\n"

    if echo "$changes" | grep -q "server.js"; then
        comment+="### Backend Changes\n"
        comment+="- Updates to server functionality\n"
        comment+="- Improved API endpoints\n\n"
    fi
    if echo "$changes" | grep -q "app.js"; then
        comment+="### Frontend Logic\n"
        comment+="- Enhancements to client-side application logic\n"
        comment+="- Improved user interactions\n\n"
    fi
    if echo "$changes" | grep -q "index.html"; then
        comment+="### User Interface\n"
        comment+="- Updates to the main page structure\n"
        comment+="- Improved HTML semantics\n\n"
    fi
    if echo "$changes" | grep -q "styles.css"; then
        comment+="### Visual Styling\n"
        comment+="- Enhancements to the application's visual design\n"
        comment+="- Improved responsiveness and layout\n\n"
    fi
    if echo "$changes" | grep -q "package.json"; then
        comment+="### Dependencies\n"
        comment+="- Updates to project dependencies\n"
        comment+="- Potential performance improvements\n\n"
    fi

    comment+="## Additional Notes\n"
    comment+="- Please report any issues or bugs you encounter\n"
    comment+="- For more details, see the full changelog below\n"

    echo -e "$comment"
}

echo "Ensuring we're on the main branch..."
git checkout main || { echo "Failed to checkout main branch"; exit 1; }

echo "Pulling latest changes..."
git pull origin main || { echo "Failed to pull latest changes"; exit 1; }

echo "Getting the latest tag..."
LATEST_TAG=$(git describe --tags --abbrev=0 2>/dev/null)

if [[ -z "$LATEST_TAG" ]]; then
    NEW_VERSION="v0.0.1"
else
    VERSION_NUMBER=${LATEST_TAG#v}
    NEW_VERSION="v$(increment_version $VERSION_NUMBER 2)"
fi

echo "Preparing release $NEW_VERSION"

echo "Generating changelog..."
CHANGELOG=$(git log $(git describe --tags --abbrev=0 2>/dev/null)..HEAD --pretty=format:"- %s")

STRUCTURED_COMMENT=$(generate_structured_comment)

echo "Structured comment for this release:"
echo -e "$STRUCTURED_COMMENT"
echo "Please review the above comment. Press Enter to use it, or type a custom comment:"
read -e CUSTOM_COMMENT

if [[ -z "$CUSTOM_COMMENT" ]]; then
    CUSTOM_COMMENT="$STRUCTURED_COMMENT"
fi

echo "Updating package-lock.json..."
npm install --package-lock-only

echo "Updating package.json version..."
npm version $NEW_VERSION --no-git-tag-version || { echo "Failed to update package.json version"; exit 1; }

echo "Adding all changes..."
git add . || { echo "Failed to add changes"; exit 1; }

echo "Committing changes..."
git commit -m "Release $NEW_VERSION

$CUSTOM_COMMENT

Changelog:
$CHANGELOG" || { echo "Failed to commit changes"; exit 1; }

echo "Creating new tag..."
git tag -a $NEW_VERSION -m "Release $NEW_VERSION

$CUSTOM_COMMENT

Changelog:
$CHANGELOG" || { echo "Failed to create tag"; exit 1; }

echo "Pushing changes and tags to GitHub..."
git push origin main || { echo "Failed to push to main"; exit 1; }
git push origin $NEW_VERSION || { echo "Failed to push tag"; exit 1; }

echo "Creating GitHub release..."
if command -v gh &> /dev/null; then
    gh release create $NEW_VERSION -t "Release $NEW_VERSION" -n "$CUSTOM_COMMENT

## Full Changelog:
$CHANGELOG" || { echo "Failed to create GitHub release using gh CLI"; exit 1; }
else
    echo "GitHub CLI not found. Pushing tag only."
    echo "Please create the release on GitHub manually."
fi

echo "Release $NEW_VERSION has been created and pushed to GitHub"

echo "Release process completed successfully!"
