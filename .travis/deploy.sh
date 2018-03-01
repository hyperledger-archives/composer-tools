#!/bin/bash

# Exit on first error, print all commands.
set -ev
set -o pipefail

# Grab the Concerto directory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
date
ME=`basename "$0"`

# Check that this is the main repository.
if [[ "${TRAVIS_REPO_SLUG}" != hyperledger* ]]; then
    echo "Skipping deploy; wrong repository slug."
    exit 0
fi

# Set the NPM access token we will use to publish.
npm config set registry https://registry.npmjs.org/
npm config set //registry.npmjs.org/:_authToken ${NPM_TOKEN}

# Set the GitHub deploy key we will use to publish.
set-up-ssh --key "$encrypted_c093d7331cc3_key" \
           --iv "$encrypted_c093d7331cc3_iv" \
           --path-encrypted-key ".travis/github_deploy_key.enc"

# Change from HTTPS to SSH.
./.travis/fix_github_https_repo.sh

# Test the GitHub deploy key.
git ls-remote

# Set the target directory to load the GitHub repository.
# export TODIR="${DIR}/packages/composer-website/out/gh-pages"

# Push the code to npm.
if [ -z "${TRAVIS_TAG}" ]; then

    # Set the prerelease version.
    npm run pkgstamp
    export VERSION=$(node -e "console.log(require('${DIR}/package.json').version)")

    # Publish with unstable tag. These are development builds.
    echo "Pushing with tag unstable"
    lerna exec --ignore '@(composer-protobuf|fabric-dev-servers)' -- npm publish --tag=unstable 2>&1 | tee

    # Load the GitHub repository using the gh-pages branch.
    # git clone -b gh-pages git@github.com:hyperledger/composer.git ${TODIR}
    # Move the built zip/tar.gz files for the tools to the website
    # cp ${DIR}/packages/fabric-dev-serves/fabric-dev-servers.* .
    # Add all the changes, commit, and push to the GitHub repository.
    # cd ${TODIR}
    # git add .
    # git commit -m "Automatic deployment of website"
    # git push origin gh-pages


else

    # Grab the current version.
    export VERSION=$(node -e "console.log(require('${DIR}/package.json').version)")

    # Publish with latest tag (default). These are release builds.
    echo "Pushing with tag latest"
    lerna exec --ignore '@(composer-protobuf|fabric-dev-servers)' -- npm publish 2>&1 | tee

    # Configure the Git repository and clean any untracked and unignored build files.
    git config user.name "${GH_USER_NAME}"
    git config user.email "${GH_USER_EMAIL}"
    git checkout -b master
    git reset --hard
    git clean -d -f

    # Bump the version number.
    npm run pkgbump
    export NEW_VERSION=$(node -e "console.log(require('${DIR}/package.json').version)")

    # Add the version number changes and push them to Git.
    git add .
    git commit -m "Automatic version bump to ${NEW_VERSION}"
    git push origin master

fi
date
