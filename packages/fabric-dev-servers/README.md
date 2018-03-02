# fabric-dev-servers

This repository contains a number of helper scripts to start up a Hyperledger Fabric v1.1
network for development purposes. You can use the Hyperledger Fabric network created by these scripts to quickly deploy Blockchain business networks built using Hyperledger Composer, and test applications that depend on a running network.


## Available versions of Hyperledger Fabric
This dev server package contains scripts to setup 2 different levels of fabric. 
1. A released version of Hyperledger Fabric V1.0
2. A released version of Hyperledger Fabric V1.1

You can select a version by setting the environment variable `HL_FABRIC_VERSION`. If set to `hlfv1` or not set you
will get Hyperledger Fabric v1.0. If set to `hlfv11` you will get Hyperledger Fabric V1.1

If you are using Hyperledger Composer v0.16.x then you will want to use Hyperledger Fabric V1.0. If you are using
Hyperledger Composer v0.17 or later then you will want to use Hyperledger Fabric V1.1.

Some of the scripts use the Hyperleder Composer CLI; previously these have used the composer executable that was on the system path. 
If you are running with a locally installed composer CLI, or a development build this meant that using the scripts could be hard. 

Setting  `HL_COMPOSER_CLI` to the actual version of composer you want will ensure it used. For example for a local install follow this

```bash
$ npm install composer-cli
$ # install locally to the node_modules directory of this packge
$ export HL_COMPOSER_CLI=$(npm bin)/composer
$ # this will now use the local version
$ npx composer --version
$ # this can be used to get npm to run the local version.
```

> Note: to be more consistent the environment variables now also have `HL_` prefixed alternatives

# Usage

## Step 1: Getting Hyperledger Fabric running

These scripts use bash and Docker. You must ensure that both bash and Docker are installed on the target system before running these scripts.

1. In a directory of your choice (these instructions will assume `~/fabric-tools`), download the archive file that contains these tools. There are both .zip and .tar.gz formats - select one of these options:

```
$ mkdir ~/fabric-tools && cd ~/fabric-tools
$ curl -O https://raw.githubusercontent.com/hyperledger/composer-tools/master/packages/fabric-dev-servers/fabric-dev-servers.zip
$ unzip fabric-dev-servers.zip
```

```
$ mkdir ~/fabric-tools && cd ~/fabric-tools
$ curl -O https://raw.githubusercontent.com/hyperledger/composer-tools/master/packages/fabric-dev-servers/fabric-dev-servers.tar.gz
$ tar xzf fabric-dev-servers.tar.gz
```
2. Select the version of Hyperledger Fabric you wish to use. If for example you are using Hyperledger Composer v0.17
or higher then you should select Hyperledger Fabric V1.1 usually by exporting the environment variable as follows
```
export FABRIC_VERSION=hlfv11
```

3. If this is the first time that you have run these scripts, you'll need to download Hyperledger Fabric first. If you have already downloaded Hyperledger Fabric, then first start Hyperledger Fabric, and then create a Hyperledger Composer PeerAdmin card. After that you can then choose to stop Hyperledger Fabric, and start it again later. Alternatively, to completely clean up, you can teardown Hyperledger Fabric.

All the scripts will be available in the directory `~/fabric-tools`. A typical sequence of commands for using these scripts with Hyperledger Composer would be:

```
$ cd ~/fabric-tools
$ ./downloadFabric.sh
$ ./startFabric.sh
$ ./createPeerAdminCard.sh
```

Then at the end of your development session:

```
$ cd ~/fabric-tools
$ ./stopFabric.sh
$ ./teardownFabric.sh
```

4. In practice however, this is a long set of commands to run, the `startFabric.sh` script will stop running containers, and start them. Docker will download any images that it doesn't have. 

## Script details

### Downloading Hyperledger Fabric

Issue from the `fabric-tools` directory:

```
$ ./downloadFabric.sh
```

### Starting Hyperledger Fabric

Issue from the `fabric-tools` directory:

```
$ ./startFabric.sh
```

By default, this script will pause for 15 seconds to let Hyperledger Fabric start - on some systems this isn't enough. If you see errors from running `startFabric.sh`, you can alter this value. It's controlled by a environment variable that takes a numeric value representing the number of seconds to wait.

```
$ export FABRIC_START_TIMEOUT=30
```

### Stop Hyperledger Fabric

Issue from the `fabric-tools` directory:

```
$ ./stop.sh
```

### Create Hyperledger Composer PeerAdmin card

Issue from the `fabric-tools` directory:

```
$ ./createPeerAdminCard.sh
```

Note: this will create a Hyperledger Composer card specifically for the use of deploying a business network either
by using deploy or via install/start.

### Teardown Hyperledger Fabric

Issue from the `fabric-tools` directory:

```
$ ./teardownFabric.sh
```

### Command Ordering

This diagram should to clarify the order in which the scripts can be run:

![](CmdOrder.png).

# Additional commands

It can sometimes be needed to delete all existing containers and images

```
$ # stop all running containers
$ docker kill $(docker ps -q)

$ # removes all the current containers
$ docker rm $(docker ps -a -q) -f

$ # removes all the downloaded images
$ docker rmi $(docker images -q) -f
```

To assist with this, there is a script within fabric-dev-servers `teardownAllDocker.sh`. This has two options. Either kill and remove the running containers, or to kill and remove the running containers, and also to delete all the downloaded images.

```
./teardownAllDocker.sh
For all Docker containers or images (not just Hyperledger Fabric and Hyperledger Composer)
1 - Kill and remove only the containers
2 - Kill and remove the containers and remove all the downloaded images
3 - Quit and not do anything

1) Kill & Remove
2) Remove Images
3) Quit
Please select which option >
```

# Development Mode when using Hyperledger Fabric V1.1
There maybe a need to put Hyperledger Fabric into development mode. You would only need to do this for certain
circumstances, for example if you are a contributer and you have a need to debug composer code. To start the fabric
in development mode you pass the parameter -d or --dev to `startFabric.sh`, do for example
```
startFabric.sh --dev
```
