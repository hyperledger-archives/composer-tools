# fabric-dev-servers

This repository contains a number of helper scripts to start up Hyperledger Fabric servers
for development purposes. It can be very useful to have some scripts to quickly start up
a Fabric instance to test applications against.

# Usage

The scripts use a combination of bash shell scripts, npm task running, and node.js applications using the
Hyperledger Fabric node.js SDK.  Node v6 and NPM v4 should be installed.

## Step 1: Getting Hyperledger Fabric running

These scripts use Node v6, and bash, which are Hyperledger Composer depencies. Choose a directory that you wish to have the setup scripts within.

1. In a directory of your choice (will assume `~/fabric-tools`) get the zip file that contains the tools.  There are both .zip and .tar.gz formats
```
$ mkdir ~/fabric-tools && cd ~/fabric-tools
$ curl -O https://raw.githubusercontent.com/hyperledger/composer-tools/master/fabric-dev-servers/fabric-dev-servers.zip
$ unzip fabric-dev-servers.zip
```

```
$ mkdir ~/fabric-tools && cd ~/fabric-tools
$ curl -O https://raw.githubusercontent.com/hyperledger/composer-tools/master/fabric-dev-servers/fabric-dev-servers.tar.gz
$ tar xzf fabric-dev-servers.tar.gz
```

2. Choose which version of Fabric to use. For v0.6 this needs to be set explicitly as follows.

```
$ export FABRIC_VERSION=hlfv0.6
```

For v1.0-alpha, there is *nothing to as this the default*. But to 'unset' the v0.6, or to be explicit in using v1 use this command

```
$ export FABRIC_VERSION=hlfv1
```

3. If this is the first time, you'll need to download the fabric first. If you have already downloaded then first start the fabric, and create a Composer profile.  After that you can then choose to stop the fabric, and start it again later. Alternatively to completely clean up you can teardown the Fabric and the Composer profile.

All the scripts will be in the directory `~/fabric-tools`  A typical sequence  for Hyperledger Composer use would be

```
$ cd ~/fabric-tools
$ ./downloadFabric.sh
$ ./startFabric.sh
$ ./createComposerProfile.sh
```

Then at the end of your development session

```
$ cd ~/fabric-tools
$ ./stopFabric.sh
$ ./teardownFabric.sh
```

*If you want to swap between v0.6 and v1.0, ensure you have issued a `stopFabric.sh` and a `teardownFabric.sh` command first be START on the other version*

## Script details

### Downloading Fabric

Issue from the `fabric-tools` directory
```
$ ./downloadFabric.sh
```

### Starting Fabric

Issue  from the `fabric-tools` directory
```
$ ./startFabric.sh
```

### Stop Fabric

Issue from the `fabric-tools` directory
```
$ ./stop.sh
```

By default, this script will pause for 15seconds to let Fabric start - on some systems this isn't enough. If you see fails in running `startFabric.sh` you can alter this value. It's controlled by a environment variable that takes a numeric value representing the number of seconds to wait.

```
$ export FABRIC_START_TIMEOUT=30
```

### Create Composer Profile

Issue from the `fabric-tools` directory
```
$ ./createComposerProfile.sh
```

Note: this create a Hyperledger Composer profile specifically to connect to the development fabric you've already started.

### Teardown Fabric

Issue from the `fabric-tools` directory
```
$ ./teardownFabric.sh
```


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
