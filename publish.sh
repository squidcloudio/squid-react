#!/bin/bash

# Check if the first argument is 'beta' to determine the release type
if [ "$1" == "beta" ]; then
    RELEASE_TYPE="beta"
else
    RELEASE_TYPE="stable"
fi

# Function to get the current version from package.json
getCurrentVersion() {
    if [ "$RELEASE_TYPE" == "beta" ]; then
        # Fetch the latest beta version
        echo $(npm view . version --tag beta)
    else
        # Fetch the latest stable version
        echo $(npm view . version)
    fi
}

# Function to increment version based on release type
incrementVersion() {
    local version=$1
    local major=$(echo $version | cut -d. -f1)
    local minor=$(echo $version | cut -d. -f2)
    local patch=$(echo $version | cut -d. -f3)
    patch=$((patch+1))
    if [ "$RELEASE_TYPE" == "beta" ]; then
        # For beta, increment the patch version and append '-beta'
        echo "$major.$minor.$patch-beta"
    else
        # For stable, increment the patch version
        echo "$major.$minor.$patch"
    fi
}

# Main script execution starts here

# Ensure package.json exists
if [ ! -f package.json ]; then
    echo "Error: package.json not found."
    exit 1
fi

# Fetch current version and calculate new version
current_version=$(getCurrentVersion)
new_version=$(incrementVersion $current_version)

echo "Current version: $current_version"
echo "New version: $new_version"

# Update package.json with the new version
npm version $new_version --no-git-tag-version

# Publish the package
if [ "$RELEASE_TYPE" == "beta" ]; then
    npm publish --tag beta
else
    npm publish
fi

echo "Package published with version $new_version"
