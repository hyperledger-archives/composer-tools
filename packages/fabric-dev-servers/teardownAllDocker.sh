#!/bin/bash

echo "Do you wish to remove ALL Docker containers (not just Hyperledger Fabric & Composer)?"
select yn in "Yes" "No"; do
    case $yn in
        Yes ) docker ps -aq | xargs docker rm -f || echo "Already removed"; break;;
        No ) exit;;
    esac
done
