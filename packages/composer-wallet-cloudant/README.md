# composer-wallet-cloudant

This is Hyperledger Composer Wallet implementation using the [Cloudant NoSQL](https://console.bluemix.net/docs/services/Cloudant/getting-started.html) database (based on Apache CouchDB).

> Be aware that the 'Lite' plan is rate limited to the number of queries that can be performed per second.

## Usage

The steps below assume that you have an application or playground, or rest server for Hyperledger Composer that wish to use.
Also it assumes you are familar with NPM, and the card concept in the Composer

### *Step 1*

- Signup for a IBM Cloud account (the developer plan is free and includes object storage)
- Follow the [instructions](https://console.bluemix.net/docs/services/Cloudant/tutorials/create_service.html#creating-a-cloudant-nosql-db-instance-on-ibm-cloud) to create a Cloudant Services 
- Once created, create [service credentials](https://console.bluemix.net/docs/services/Cloudant/tutorials/create_service.html#the-service-credentials) 
- Once the credential has been created, save a copy as a json file, call it `cardstore-cloudant.json'

- Edit the `cardstore-cloudant.json` file to look like the following. You may wish to adjust the database field to be something else. This is the name of the database that will created in the Cloudant service.

```
{
  "composer": {
    "wallet": {
      "type": "@ampretia/composer-wallet-cloudant",
      "options": {
        "database": "alpha-metal",
        "username": "xxxxxxxxxxxxxxxxxxxxxxx",
        "password": "yyyyyyyyyyyyyyyyyyyyyyy",
        "host": "zzzzzzzzzzzzzzzzzzzzzzzzzzz-bluemix.cloudant.com",
        "port": 443,
        "url": "https://zzzzzzzz-bluemix.cloudant.com"
      }
    }
  }
}

```

### *Step 2*

Firstly, this module that provides the support to connect from Composer to Cloudant needs to be installed.
This is loaded using a node.js require statment, and the current preview will look for this in the global modules. 

```
npm install -g @ampretia/composer-wallet-cloudant
```

### *Step 3*

Setup the NODE_CONFIG environment variable to use the Cloudant wallet, and use the service credentials.

```bash
$ export NODE_CONFIG=$(cat cardstore-cloudant.json)
```

The any application (or command line, eg `composer card list`) that is in this shell will use the cloud wallets. 
