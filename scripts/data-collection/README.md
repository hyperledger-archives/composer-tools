# Data Collection Utility

This is a simple shell script that can be used on Composer development systems to gather data that may help with problem diagnosis. 

# Usage
You can simply download this script and execute it from your local system. 
Open a terminal and paste in the following command:
`curl -sSL https://raw.githubusercontent.com/hyperledger/composer-tools/master/scripts/data-collection/gatherData.sh | bash`

This should create a compressed tar file in your /tmp directory that contains an environment log file that details the current development environment and a series of log files for each docker VM that is currently running.

## License <a name="license"></a>
Hyperledger Project source code files are made available under the Apache License, Version 2.0 (Apache-2.0), located in the [LICENSE](LICENSE.txt) file. Hyperledger Project documentation files are made available under the Creative Commons Attribution 4.0 International License (CC-BY-4.0), available at http://creativecommons.org/licenses/by/4.0/.