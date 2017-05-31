#!/bin/bash

# Exit on first error, print all commands.
set -ev

rm -rf ~/.composer-connection-profiles/hlfv1/*
rm -rf ~/.hfc-key-store/*

# create a composer connection profile
mkdir -p ~/.composer-connection-profiles/hlfv1
cat << EOF > ~/.composer-connection-profiles/hlfv1/connection.json
{
    "type": "hlfv1",
    "orderers": [
       { "url" : "grpc://localhost:7050" }
    ],
    "ca": { url: "http://localhost:7054", name: "ca.example.com"},
    "peers": [
        {
            "requestURL": "grpc://localhost:7051",
            "eventURL": "grpc://localhost:7053"
        },
        {
            "requestURL": "grpc://localhost:7056",
            "eventURL": "grpc://localhost:7058"
        }
    ],
    "keyValStore": "${HOME}/.hfc-key-store",
    "channel": "mychannel",
    "mspID": "Org1MSP",
    "timout": "300"
}
EOF
echo "Hyperledger Composer profile has been created for the Hyperledger Fabric v1.0 instance"
