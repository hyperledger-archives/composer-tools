# Data Collection Utility

This is a simple shell script that can be used on Composer development systems to gather data that may help with problem diagnosis. 

# Usage
You can simply download this script and execute it from your local system. 
Open a terminal and paste in the following command:
`curl -sSL https://raw.githubusercontent.com/hyperledger/composer-tools/master/scripts/data-collection/gatherData.sh | bash`

This should create a compressed tar file in your /tmp directory that contains an environment log file that details the current development environment and a series of log files for each docker VM that is currently running.