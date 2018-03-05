# composer-wallet-ibmcos

This is Hyperledger Composer Wallet implementation using the [IBM Cloud Object Storage](https://www.ibm.com/cloud/object-storage) as a store.

This uses the S3 API, so conversion to other Object Storage services should be feasible.

## Usage

The steps below assume that you have an application or playground, or rest server for Hyperledger Composer that wish to use.
Also it assumes you are familar with NPM, and the card concept in the Composer


### *Step 1*

- Signup for a IBM Cloud account (the developer plan is free and includes object storage)
- Create a Cloud Object Store bucket. Would suggest to under the 'Select Service ID' automatically create a service
- Also if you want to use the AWS CLI to access the bucket specify the following in the Add Inline Configuration Parameters (Optional) field: {"HMAC":true}

You will need then to keep a copy of the Service Credentials. These are of the form 
```
{
  "apikey": "0viPHOY7LbLNa9eLftrtHPpTjoGv6hbLD1QalRXikliJ",
  "cos_hmac_keys": {
      "access_key_id": "347aa3a4b34344f8bc7c7cccdf856e4c",
      "secret_access_key": "gvurfb82712ad14e7a7915h763a6i87155d30a1234364f61"
  },
  "endpoints": "https://cos-service.bluemix.net/endpoints",
  "iam_apikey_description": "Auto generated apikey during resource-key operation for Instance - crn:v1:bluemix:public:cloud-object-storage:global:a/3ag0e9402tyfd5d29761c3e97696b71n:d6f74k03-6k4f-4a82-b165-697354o63903::",
  "iam_apikey_name": "auto-generated-apikey-f9274b63-ef0b-4b4e-a00b-b3bf9023f9dd",
  "iam_role_crn": "crn:v1:bluemix:public:iam::::serviceRole:Manager",
  "iam_serviceid_crn": "crn:v1:bluemix:public:iam-identity::a/3ag0e9402tyfd5d29761c3e97696b71n::serviceid:ServiceId-540a4a41-7322-4fdd-a9e7-e0cb7ab760f9",
  "resource_instance_id": "crn:v1:bluemix:public:cloud-object-storage:global:a/3ag0e9402tyfd5d29761c3e97696b71n:d6f74k03-6k4f-4a82-b165-697354o63903::"
}
```

More information in the [IBM Cloud Documentation](https://console.bluemix.net/docs/services/cloud-object-storage/iam/service-credentials.html#service-credentials) 

### *Step 2*

Firstly, this module that provides the support to connect from Composer to the Object Storage needs to be installed.
This is loaded using a node.js require statment, and the current preview will look for this in the global modules. 

```
npm install -g @ampretia/composer-waller-ibmcos
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
    "cardstore": {
      "type": "@ampretia/composer-wallet-ibmcos",
      "desc": "Uses the IBM Cloud Object Store",
      "options": {
        "bucketName": "alpha-metal",
        "endpoint": "s3.eu-gb.objectstorage.softlayer.net",
        "apikey": "0viPHOY7LbLNa9eLftrtHPpTjoGv6hbLD1QalRXikliJ",
        "serviceInstanceId": "crn:v1:bluemix:public:cloud-object-storage:global:a/3ag0e9402tyfd5d29761c3e97696b71n:d6f74k03-6k4f-4a82-b165-697354o63903::"
      }
    }
  }
}
```

- `type` is the name of this module
- `desc` is some text for the humans
- `bucketName` is the buckName you created
- `endpoint` is the *Service Endpoint* from the *Endpoint* section in the Object Store dasboard
- `apikey` is the apikey from the service credentials
- `serviceInstanceId` is the *resource_instance_id* from the service credentials

*Environment Variable*

As this is using the *config* module specifing the details on the command line via environment variables can be achieved by

```
export NODE_CONFIG={"composer":{"cardstore":{"type":"@ampretia/composer-wallet-ibmcos","desc":"Uses the IBM Cloud Object Store","options":{"bucketName":"alpha-metal","endpoint":"s3.eu-gb.objectstorage.softlayer.net","apikey":"0viPHOY7LbLNa9eLftrtHPpTjoGv6hbLD1QalRXikliJ","serviceInstanceId":"crn:v1:bluemix:public:cloud-object-storage:global:a/3ag0e9402tyfd5d29761c3e97696b71n:d6f74k03-6k4f-4a82-b165-697354o63903::"}}}}
```

The any application (or command line, eg `composer card list`) that is in this shell will use the cloud wallets. 
