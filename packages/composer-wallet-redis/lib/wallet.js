/*
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
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

const Wallet = require('composer-common').Wallet;
const path = require('path');
const redis = require('redis');
const {promisify} = require('util');

/** */
class RedisWallet extends Wallet{

    /**
     * Get a "path name"
     * @private
     * @param {String} name name to use as the key
     * @return {String} full 'path' name
     */
    formKey(name) {
        if (name.startsWith(this.namePrefix)){
            return name;
        } else {
            return path.join(this.namePrefix,name);
        }

    }

    /**
     * @param {*} options Options for this implementations
     */
    constructor(options){
        super();
        if (!options) {
            throw new Error('Need configuration');
        }
        if (!options.namePrefix){
            throw new Error('Need a namePrefix in options');
        }

        this.namePrefix = options.namePrefix;
        this.client = redis.createClient(options);

        this.getAsync = promisify(this.client.get).bind(this.client);
        this.setAsync = promisify(this.client.set).bind(this.client);
        this.keysAsync = promisify(this.client.keys).bind(this.client);
        this.existsAsync = promisify(this.client.exists).bind(this.client);
        this.delAsync = promisify(this.client.del).bind(this.client);
        this.saddAsync = promisify(this.client.sadd).bind(this.client);
        this.smembersAsync = promisify(this.client.smembers).bind(this.client);
    }

    /**
     * List all of the credentials in the wallet.
     * @return {Promise} A promise that is resolved with
     * an array of credential names, or rejected with an
     * error.
     */
    async listNames() {
        let result= await this.keysAsync(this.namePrefix+'/*');
        result = result.map( (e) => {
            return e.replace(this.namePrefix+path.sep,'');
        } );
        return result;
    }

    /**
     * Check to see if the named credentials are in
     * the wallet.
     *
     * @param {string} name The name of the credentials.
     * @return {Promise} A promise that is resolved with
     * a boolean; true if the named credentials are in the
     * wallet, false otherwise.
     */
    async contains(name) {
        if (!name) {
            return Promise.reject(new Error('Name must be specified'));
        }
        let rc = await this.existsAsync(this.formKey(name));
        if (rc === 1){
            return true;
        } else {
            return false;
        }
    }

    /**
     * Get the named credentials from the wallet.
     *
     * @param {string} name The name of the credentials.
     * @return {Promise} A promise that is resolved with
     * the named credentials, or rejected with an error.
     */
    async get(name) {
        if (!name) {
            return Promise.reject(new Error('Name must be specified'));
        }
        // let result = await this.getAsync(this.formKey(name));
        let result = await this.smembersAsync(this.formKey(name));
        if (result.length === 0){
            throw new Error('The specified key does not exist');
        }

        let type;
        let data;
        if (result[0].startsWith('type=')){
            type = result[0].replace('type=','');
            data = result[1].replace('data=','');
        } else {
            type = result[1].replace('type=','');
            data = result[0].replace('data=','');
        }

        if (type === 'text/plain'){
            return data;
        } else if (type === 'application/octet-stream'){
            return Buffer.from(data, 'base64');
        } else {
            throw new Error('Unkown type being stored '+type);
        }

    }

    /**
     * Gets all the objects under this prefix and tag
     * An empty storage service will return a map with no contents
     *
     * @return {Promise} A Promise that is resolved with a map of the names and the values
     */
    async getAll(){

        const results = new Map();
        let keys = await this.listNames();

        // use the keys to get the data, the get handles the types as needed
        for (const key of keys) {
            let mapKey = key.replace(this.namePrefix+path.sep,'');
            let value = await this.get(key);
            results.set(mapKey, value);
        }

        return results;
    }

    /**
     * Add a new credential to the wallet.
     *
     * @param {string} name The name of the credentials.
     * @param {string} value The credentials.
     * @return {Promise} A promise that is resolved when
     * complete, or rejected with an error.
     */
    async put(name, value) {
        if (!name) {
            return Promise.reject(new Error('Name must be specified'));
        }

        let key = this.formKey(name);
        let type = this._determineType(value);
        let data = this._encodeType(value,type);
        await this.delAsync(key);
        await this.saddAsync(key,'data='+data,'type='+type);

    }

    /**
     * Remove existing credentials from the wallet.
     *
     * @param {string} name The name of the credentials.
     * @return {Promise} A promise that is resolved when
     * complete, or rejected with an error.
     */
    async remove(name) {
        if (!name) {
            return Promise.reject(new Error('Name must be specified'));
        }
        return await this.delAsync(this.formKey(name));
    }

    /**
     *
     * @param {String|Buffer} value to check
     * @param {String} type the type check value for
     * @return {String} of mime type, or throw an error
     */
    _encodeType(value,type){

        if (type === 'application/octet-stream'){
            return value.toString('base64');
        } else if (type === 'text/plain'){
            return value;
        } else {
            throw new Error('Unkown type being stored '+type);
        }
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
}

module.exports = RedisWallet;