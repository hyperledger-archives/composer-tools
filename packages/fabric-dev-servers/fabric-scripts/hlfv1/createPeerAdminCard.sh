#!/bin/bash

# Grab the current directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

if [ -z "${HL_COMPOSER_CLI}" ]; then
  HL_COMPOSER_CLI=$(which composer)
fi

echo
# check that the composer command exists at a version >v0.14
COMPOSER_VERSION=$("${HL_COMPOSER_CLI}" --version 2>/dev/null)
COMPOSER_RC=$?

if [ $COMPOSER_RC -eq 0 ]; then
    AWKRET=$(echo $COMPOSER_VERSION | awk -F. '{if ($2<15 || $2>16) print "1"; else print "0";}')
    if [ $AWKRET -eq 1 ]; then
        echo $COMPOSER_VERSION is not supported for this level of fabric. Please use version 0.16
        exit 1
    else
        echo Using composer-cli at $COMPOSER_VERSION
    fi
else
    echo 'Need to have composer-cli installed at version 0.16'
    exit 1
fi

cat << EOF > /tmp/.connection.json
{
    "name": "hlfv1",
    "type": "hlfv1",
    "orderers": [
       { "url" : "grpc://localhost:7050" }
    ],
    "ca": { "url": "http://localhost:7054", "name": "ca.org1.example.com"},
    "peers": [
        {
            "requestURL": "grpc://localhost:7051",
            "eventURL": "grpc://localhost:7053"
        }
    ],
    "channel": "composerchannel",
    "mspID": "Org1MSP",
    "timeout": 300
}
EOF

PRIVATE_KEY="${DIR}"/composer/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/keystore/114aab0e76bf0c78308f89efc4b8c9423e31568da0c340ca187a9b17aa9a4457_sk
CERT="${DIR}"/composer/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/signcerts/Admin@org1.example.com-cert.pem

if "${HL_COMPOSER_CLI}" card list -n PeerAdmin@hlfv1 > /dev/null; then
    "${HL_COMPOSER_CLI}" card delete -n PeerAdmin@hlfv1
fi
"${HL_COMPOSER_CLI}" card create -p /tmp/.connection.json -u PeerAdmin -c "${CERT}" -k "${PRIVATE_KEY}" -r PeerAdmin -r ChannelAdmin --file /tmp/PeerAdmin@hlfv1.card
"${HL_COMPOSER_CLI}" card import --file /tmp/PeerAdmin@hlfv1.card 

rm -rf /tmp/.connection.json

echo "Hyperledger Composer PeerAdmin card has been imported"
"${HL_COMPOSER_CLI}" card list

