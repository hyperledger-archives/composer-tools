# composer-wallet-redis

This is Hyperledger Composer Wallet implementation using [Redis](https://redis.io/) as a store.

## Usage

The steps below assume that you have an application or playground, or rest server for Hyperledger Composer that wish to use.
Also it assumes you are familar with NPM, and the basic workings of Hyperledger Composer.


### *Step 1*

The `startRedis.sh` script contains the commands to get the docker image for redis started and running. In more detail
```
$ # get and start the redis server
$ docker run -p 6379:6379 --name composer-wallet-redis -d redis
$ # to restart it later....
$ docker start composer-wallet-redis
$ # to clearout redis contents, issue this command
$ docker exec composer-wallet-redis redis-cli -c flushall
```

### *Step 2*

Firstly, this module that provides the support to connect from Composer to the Object Storage needs to be installed.
This is loaded using a node.js require statment; this needs to either be installed globally, or within the current application package. 

```
npm install -g composer-wallet-redis
```

### *Step 3*

Configuration needs to be passed to the client appliation using composer to use this new wallet.

There are two main ways this can be achieved. Via configuration file, or via environment variables. 

*File*
Assuming that you do not have the config directory already - this is using the standard node npm `config` module


- Create a directory `config` in the current working directory of the application
- Create a file `default.json` in this `config` directory
- Ensure that the contents of the file are
```
{
  "composer": {
    "wallet": {
      "type": "composer-wallet-redis",
      "desc": "Uses a local redis instance,
      "options": {

      }
    }
  }
}
```

- `type` is the name of this module
- `desc` is some text for the humans

If you run the local docker image for redis, there is no specific configuration that is required. The redis client used will be default connect to the port that is run. More information on the client is at https://www.npmjs.com/package/redis
Any options specified in options, will be passed directly into the `redis.createClient()` function


*Environment Variable*

As this is using the *config* module specifing the details on the command line via environment variables can be achieved by

```
export NODE_CONFIG={"composer":{"wallet":{"type":"composer-wallet-redis","desc":"Uses  a local redis instance,"options":{}}}}
```

The application (or command line, eg `composer card list`) that is in this shell will use the cloud wallets backed by the redis server. 
For ease of understanding, you may wish to create a file with the json as in the step above, but then issue this command to set it in an environment variable, assuming the file is called `default.json`.
It doesn't matter the name of the file in this case - it's just being used to hold the json to make it easier for you to edit.

```
export NODE_CONFIG=$(cat default.json)
```

## Logging into redis

It's not recommended to log into the redis cli and start modifying the contents, however for debug and education purposes it is possible. 
To run the redis cli issue this command
```
docker run -it --link composer-wallet-redis:redis --rm redis redis-cli -h redis -p 6379
```

You can then issue redis command line commands to see the keys

```
> keys *
```

To clear out the data in redis, then issue

```
> flushall
```

Note that this command doesn't ask for confirmation before deleting everything so use with care.
