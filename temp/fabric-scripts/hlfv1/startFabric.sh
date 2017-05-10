#!/bin/bash

# Exit on first error, print all commands.
set -ev

# Grab the current directorydirectory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

#
cd "${DIR}"/hlfv1

docker-compose -f "${DIR}"/hlfv1/hlfv1_alpha-docker-compose.yml down
docker-compose -f "${DIR}"/hlfv1/hlfv1_alpha-docker-compose.yml up -d

# wait for Hyperledger Fabric to start
# incase of errors when running later commands, increase this value and restart
sleep 15

node create-channel.js
node join-channel.js
cd ../..
