echo "Development only script for Hyplerledger Fabric control"


# Grab the current directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
THIS_SCRIPT=`basename "$0"`
echo "Running '${THIS_SCRIPT}'"


if [ -z ${FABRIC_VERSION+x} ]; then
 echo "FABRIC_VERSION is unset, assuming hlfv1"
 FABRIC_VERSION="hlfv1"
else
 echo "FABRIC_VERSION is set to '$FABRIC_VERSION'"
fi

"${DIR}"/fabric-scripts/"${FABRIC_VERSION}"/"${THIS_SCRIPT}"
