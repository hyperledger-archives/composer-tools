/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

// Obtain the interfaces from Composer that we need to use
const Wallet = require('composer-common').Wallet;
const Logger = require('composer-common').Logger;

const path = require('path');

// implementation that we are uising
const ObjectStore = require('ibm-cos-sdk');

// Get a logger from Composer to use
const LOG = Logger.getLog('wallet/IBMCOSCardStore');

/** */
class IBMCOSWallet extends Wallet{

    /**
     * The constructor is passed the options as configured by the user.  The JSON structure of the configuration is
     * "composer": {
     *    "cardstore": {
     *    "type": "composer-wallet-ibmcos",
     *    "desc": "Uses the IBM Cloud Object Store",
     *    "options": {
     *      "bucketName": "alpha-metal",
     *      "endpoint": "s3.eu-gb.objectstorage.softlayer.net",
     *      "apikey": "xxxx",
     *      "serviceInstanceId": "yyyy"
     *    }
     *   }
     * }
     *
     * Note that the namePrefix is one option that WILL be specified by the Composer code.
     *
     * The contents of the options element are passed to this Constructore as an object
     * @param {Object} options Options for this implementations
     */
    constructor(options){
        super();

        if (!options) {
            throw new Error('Need configuration');
        }
        if (!options.endpoint){
            throw new Error('Need an endpoint in options');
        }
        if (!options.apikey){
            throw new Error('Need an apiKey in options');
        }
        if (!options.serviceInstanceId){
            throw new Error('Need an serviceInstanceId in options');
        }
        if (!options.bucketName){
            throw new Error('Need an bucketName in options');
        }
        if (!options.namePrefix){
            throw new Error('Need an namePrefix in options');
        }

        let objectStoreConfig = {
            endpoint: options.endpoint,
            apiKeyId: options.apikey,
            ibmAuthEndpoint: 'https://iam.ng.bluemix.net/oidc/token',
            serviceInstanceId: options.serviceInstanceId
        };

        this.bucketName = options.bucketName;

        LOG.info('Connecting with config',objectStoreConfig);

        this.cos = new ObjectStore.S3(objectStoreConfig);
        this.namePrefix = options.namePrefix;
    }

    /**
     * Get a "path name", this is not part of the interface but is used to create a suitable name
     * to achieve separation of entries
     *
     * @private
     * @param {String} name name to use as the key
     * @return {String} full 'path' name
     */
    _path(name) {
        if (name.startsWith(this.namePrefix)){
            return name;
        }else {
            return path.join(this.namePrefix,name);
        }
    }

    /**
     * List all of the names in the wallet as scoped by the prefix; this is the names
     * only, not a list of contents.
     *
     * An empty storage service will return a array with no contents
     *
     * Note currently there is no paging support
     *
     * @return {Promise} A promise that is resolved with
     * an array of names, or rejected with an
     * error.
     */
    async listNames() {
        let params = {
            Bucket: this.bucketName,
            Prefix: this.namePrefix
        };
        // using prefix option to restrict to this prefix

        let value = await this.cos.listObjects(params).promise();
        let listOfCredentialNames = value.Contents.map( (e) => {
            return e.Key.replace(this.namePrefix+path.sep,'');
        } );

        return listOfCredentialNames;
    }

    /**
     * Gets all the objects under this prefix and tag
     * An empty storage service will return a map with no contents
     *
     * @return {Promise} A Promise that is resolved with a map of the names and the values
     */
    async getAll(){
        let params = {
            Bucket: this.bucketName,
            Prefix: this.namePrefix
        };
        // using prefix option to restrict to this prefix

        const results = new Map();
        let cardMetaData = await this.cos.listObjects(params).promise();

        // use the keys to get the data, the get handles the types as needed
        for (const data of cardMetaData.Contents) {
            let mapKey = data.Key.replace(this.namePrefix+path.sep,'');
            results.set(mapKey, await this.get(data.Key));
        }

        return results;
    }

    /**
     * Check to see if the name is present in the store
     *
     * @param {string} name The name to check
     * @return {Promise} A promise that is resolved with
     * a boolean; true if the named value is there are in the
     * store, false otherwise.
     *
     * Promise is rejected otherwise
     */
    async contains(name) {
        if (!name) {
            throw new Error('Name must be specified');
        }
        let params = {Bucket: this.bucketName, Key: this._path(name)};

        try {
            await this.cos.headObject(params).promise();
            return true;
        } catch (err) {
            if (err && err.code === 'NotFound') {
                return false;
            } else {
                throw err;
            }
        }

    }

    /**
     * Get the named credentials from the wallet.
     *
     * @param {string} name The name of the credentials.
     * @return {Promise} A promise that is resolved with
     * the named credentials, or rejected with an error if they do not exist
     */
    async get(name) {

        if (!name) {
            throw new Error('Name must be specified');
        }

        let params = {Bucket: this.bucketName, Key: this._path(name)};
        let value = await this.cos.getObject(params).promise();
        let returnValue;


        // check the returned type and see what to do
        if (value.ContentType === 'text/plain'){
            returnValue = value.Body.toString();
        } else {
            returnValue = value.Body;
        }

        return returnValue;
    }

    /**
     *
     * @param {String|Buffer} value to check
     * @return {String} of mime type, or throw an error
     */
    _determineType(value){

        if (value instanceof Buffer){
            return 'application/octet-stream';
        } else if (value instanceof String  || typeof value === 'string'){
            return 'text/plain';
        } else {
            throw new Error('Unkown type being stored');
        }
    }

    /**
     * Add a new value to the wallet.
     * If the named value already exists, then the value is overwritten
     *
     * @param {String} name The name of the key to use.
     * @param {String} value The data.
     * @param {Map|Object} [meta] Optional MAP with meta data, if an object then it will be stored in a map under key 'meta'
     * @return {Promise} A promise that is resolved when complete, or rejected if an error occurs
     */
    async put(name, value,meta = {}) {
        if (!name) {
            throw new Error('Name must be specified');
        }
        let md;
        if (meta instanceof Map){
            md=meta;
        }else {
            md = new Map().set('meta',meta);
        }
        let type = this._determineType(value);
        let uploadParams = {
            Bucket:       this.bucketName,
            Key:          this._path(name),
            Body:         value,
            ContentType : type,
            Metadata :    md
        };

        return await this.cos.putObject(uploadParams).promise();
    }

    /**
     * Remove existing credentials from the wallet.
     * If the name doesn't exist no error is thrown
     *
     * @param {string} name The name of the credentials.
     * @return {Promise} A promise that is resolved when
     * complete, or rejected if an error occurs
     */
    async remove(name) {
        if (!name) {
            throw new Error('Name must be specified');
        }

        let params = {
            Bucket: this.bucketName,
            Key: this._path(name)
        };

        return await this.cos.deleteObject(params).promise();
    }

}

module.exports = IBMCOSWallet;