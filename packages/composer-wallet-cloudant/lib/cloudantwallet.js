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

let Cloudant = require('@cloudant/cloudant');


// Get a logger from Composer to use
const LOG = Logger.getLog('wallet/CloudantWallet');

/** */
class CloudantWallet extends Wallet {

    /**s
     * The constructor is passed the options as configured by the user.  The JSON structure of the configuration is
     * "composer": {
     *    "cardstore": {
     *    "type": "@ampretia/composer-wallet-ibmcos",
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
    constructor(options) {
        super();

        if (!options) {
            throw new Error('Need configuration');
        }

        // Initialize the library with my account.
        let config = {
            account: options.username,
            password: options.password,
            plugins: 'promises'
        };

        this.cloudant = Cloudant(config);

        this.store = this.cloudant.db.use(options.database);
        LOG.info('Connecting to cloudant');

        // need this to help the code using the wallet achieve separation
        this.namePrefix = options.namePrefix;



    }

    /**
     * Gets the document representing the current wallet
     *
     * @return {Promise} resolve with the document
     */
    async _getDocument(){
        // create a document if one does not exist already
        try {

            let retval = await this.store.get(this.namePrefix, { revs_info: true });
            return retval;

        } catch (err){
            if (err._response.statusCode === 404){
                // create the document
                let retVal = await this.store.insert({ version: 'humbolt' , payload: {}}, this.namePrefix);
                return retVal;
            }
            throw err;
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

        let d = await this._getDocument();
        let payload = d.payload || {};
        let names = Object.keys(payload);
        return names;
    }

    /**
     * Gets all the objects under this prefix and tag
     * An empty storage service will return a map with no contents
     *
     * @return {Promise} A Promise that is resolved with a map of the names and the values
     */
    async getAll() {
        let d = await this._getDocument();
        let payload = d.payload || {};
        let listNames = Object.keys(payload);

        let results = new Map();
        // use the keys to get the data, the get handles the types as needed
        for (const mapKey of listNames) {
            let value = this._convertValue(payload[mapKey]);
            results.set(mapKey, value);
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
        let d = await this._getDocument();
        let payload = d.payload || {};
        if (payload[name]){
            return true;
        }else {
            return false;
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

        let d = await this._getDocument();
        let payload = d.payload || {};
        if (payload[name]){
            return this._convertValue(payload[name]);

        } else {
            throw new Error(`${name} does not exist`);
        }

    }

    /**
     * Converts the value to the correct type
     *
     * @param {Object} data payload that needs to be converted
     * @return {Buffer|String} type correctly processed or and erroe
     */
    _convertValue(data){
        if (data.type==='text/plain'){
            return JSON.parse(data.value);
        } else if (data.type==='application/octet-stream') {
            return Buffer.from(JSON.parse(data.value),'base64');
        } else {
            throw new Error(`Unknown type being retrieved ${data.type}`);
        }
    }

    /**
     *
     * @param {String|Buffer} value to check
     * @return {String} of mime type, or throw an error
     */
    _determineType(value) {

        if (value instanceof Buffer) {
            return 'application/octet-stream';
        } else if (value instanceof String || typeof value === 'string') {
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
    async put(name, value, meta = {}) {
        if (!name) {
            throw new Error('Name must be specified');
        }

        let d = await this._getDocument();
        // need to update the docment with the ky and the value
        let data = {
            _id : d.id || d._id,
            _rev: d.rev || d._rev,
            payload : d.payload || {}
        };


        data.payload[name] = {
            type: this._determineType(value)            ,
            meta : JSON.stringify(meta)
        };

        if (data.payload[name].type === 'text/plain' ){
            data.payload[name].value=JSON.stringify(value);
        } else {
            data.payload[name].value=JSON.stringify(Buffer.from(value).toString('base64'));
        }


        return await this.store.insert(data, this.namePrefix);

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
        let d = await this._getDocument();
        // need to update the docment with the ky and the value
        // need to update the docment with the ky and the value
        let data = {
            _id : d.id || d._id,
            _rev: d.rev || d._rev,
            payload : d.payload || {}
        };

        delete data.payload[name];
        return await this.store.insert(data, this.namePrefix);

    }

}

module.exports = CloudantWallet;