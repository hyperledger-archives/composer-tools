#!/bin/bash

# Exit on first error, print all commands.
set -ev
set -o pipefail

# Grab the root (parent) directory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
ME=`basename "$0"`

echo ${ME} `date`

#source ${DIR}/build.cfg

#if [ "${ABORT_BUILD}" = "true" ]; then
#  echo "-#- exiting early from ${ME}"
#  exit ${ABORT_CODE}
#fi

cd "${DIR}" && npm install

#cd ${DIR} && pwd
cd "${DIR}"/packages/fabric-dev-servers
npm install
npm run build-archives

# now need to put the zip somewhere

mkdir ./fabric-tools && cd ./fabric-tools

# this should be moved to a better location
cp ../fabric-dev-servers.zip .
unzip fabric-dev-servers.zip
./downloadFabric.sh
./startFabric.sh
./createComposerProfile.sh
./stopFabric.sh
./teardownFabric.sh


exit 0
