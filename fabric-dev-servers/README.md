# fabric-dev-servers

This repository contains a number of helper scripts to start up Hyperledger Fabric servers
for development purposes. It can be very useful to have some scripts to quickly start up
a Fabric instance to test applications against.

# Usage

The scripts use a combination of bash shell scripts, npm task running, and node.js applications using the
Hyperledger Fabric node.js SDK.  Node v6 and NPM v4 should be installed.


## Step 1: Getting Hyperledger Fabric running

1. In a directory of your choice, clone the `fabric-dev-servers` git repo for the helper scripts to get Fabric running for development use.
```
$ git clone https://github.com/mbwhite/fabric-dev-servers.git
$ cd fabric-dev-servers
```
2. Choose which version of Fabric to use. For v0.6
```
$ npm set fabric-dev-servers:fabricversion hlfv0.6
```

For v1.0-alpha, there is nothing to as this the default. But to 'unset' the v0.6, or to be explicit use this command

```
$ npm set fabric-dev-servers:fabricversion hlfv1
```

3. Setup the required depenendancies
```
$ npm install
```

4. This repository and it's scripts are ready to go! If this is the first time, you'll need to download the Fabric, start the Fabric, and create a Composer profile.  After that you can then choose to either stop the Fabric, and start it again later. Alternatively to completely clean up you can teardown the Fabric and the Composer profile.

*If you want to swap between v0.6 and v1.0, ensure you have issued a STOP and a TEARDOWN command first be START on the other version*

### Downloading Fabric

Issue _one_ of these commands from the `fabric-dev-servers` directory
```
$ ./download.sh
$ npm run download
```

### Starting Fabric

Issue _one_ of these commands from the `fabric-dev-servers` directory
```
$ ./start.sh
$ npm start
```

### Stop Fabric

Issue _one_ of these commands from the `fabric-dev-servers` directory
```
$ ./stop.sh
$ npm stop
```

### Create Composer Profile

Issue _one_ of these commands from the `fabric-dev-servers` directory
```
$ ./createComposerProfile.sh
$ npm run createComposerProfile
```

Note: this create a [Hyperledger Composer](https://github.com/hyperledger/composer) profile specifically to connect to the development Fabric you've already started.

### Teardown Fabric

Issue _one_ of these commands from the `fabric-dev-servers` directory
```
$ ./teardown.sh
$ npm run teardown
```
Note: this removes the Composer profile for the currently specific version of the Fabric

### Command Ordering

This diagram should to clarify the order in which the scripts can be run.  Remember the version will default to hlfv1 if the version command is not run.

![](CmdOrder.png).

# Additional commands

It can sometimes be needed to delete all existing containers and images

```
$  # removes all the currently running containers
$  docker rm $(docker ps -a -q) -f

$  # removes all the downloaded images
$  docker rmi $(docker images -q) -f
```
