#!/bin/bash

# Exit on first error, print all commands.
# set -ev
# Grab the current directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo
# check that the composer command exists at a version >v0.14
if hash composer 2>/dev/null; then
    composer --version | awk -F. '{if ($2<14) exit 1}'
    if [ $? -eq 1 ]; then
        echo 'Sorry, Need to have composer-cli installed at v0.15 or greater' 
        exit 1
    else
        echo Using composer-cli at $(composer --version)
    fi
else
    echo 'Need to have composer-cli installed at v0.15 or greater'
    exit 1
fi
# need to get the certificate 

cat "${DIR}"/composer/creds/PeerAdmin | jq -r .enrollment.identity.certificate > /tmp/.PeerAdmin.cert 
cat << EOF > /tmp/.connection.json
{
    "name": "hlfv1-dev",
    "type": "hlfv1",
    "orderers": [
       { "url" : "grpc://localhost:7050" }
    ],
    "ca": { "url": "http://localhost:7054", "name": "ca.example.com"},
    "peers": [
        {
            "requestURL": "grpc://localhost:7051",
            "eventURL": "grpc://localhost:7053"
        }
    ],
    "keyValStore": "${HOME}/.hfc-key-store",
    "channel": "mychannel",
    "mspID": "Org1MSP",
    "timeout": "300"
}
EOF

PRIVATE_KEY="${DIR}"/composer/creds/9022d671ceedbb24af3ea69b5a8136cc64203df6b9920e26f48123fcfcb1d2e9-priv

composer card create -j /tmp/.connection.json -u PeerAdmin -c /tmp/.PeerAdmin.cert -k "${PRIVATE_KEY}" -r PeerAdmin --file /tmp/PeerAdmin@hlfv1.card 
composer card import --file /tmp/PeerAdmin@hlfv1.card 

rm -rf /tmp/.PeerAdmin.cert 
rm -rf /tmp/.connection.json

echo "Hyperledger Composer PeerAdmin card has been imported"
composer card list

