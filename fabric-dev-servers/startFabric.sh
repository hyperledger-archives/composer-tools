#!/bin/bash


DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
npm install --prefix "${DIR}"

source "${DIR}"/_loader.sh
