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

const creds = require('../creds.json');

module.exports.getStore = require('../index.js').getStore;
module.exports.wrongConfigs = [
    { c: null, text: 'Need configuration' },
    { c: {}, text: 'Need an endpoint in options' },
    { c: { namePrefix:'xx,',endpoint: 'xx', bucketName: 'xx', apikey: 'xx' }, text: 'Need an serviceInstanceId in options' },
    { c: { namePrefix:'xx,',endpoint: 'xx', bucketName: 'xx', serviceInstanceId: 'xx' }, text: 'Need an apiKey in options' },
    { c: { namePrefix:'xx,',endpoint: 'xx', apikey: 'xx', serviceInstanceId: 'xx' }, text: 'Need an bucketName in options' },
    { c: { namePrefix:'xx,',bucketName: 'xx', apikey: 'xx', serviceInstanceId: 'xx' }, text: 'Need an endpoint in options' },
    { c: { endpoint:'xx,',bucketName: 'xx', apikey: 'xx', serviceInstanceId: 'xx' }, text: 'Need an namePrefix in options' }];
module.exports.correctConfigs=[
    {
        'bucketName': creds.bucket_name,
        'endpoint': creds.endpoint,
        'apikey': creds.apikey,
        'serviceInstanceId': creds.resource_instance_id
    }
];
module.exports.clean=async ()=>{

    let objectStoreConfig = {
        endpoint: creds.endpoint,
        apiKeyId: creds.apikey,
        ibmAuthEndpoint: 'https://iam.ng.bluemix.net/oidc/token',
        serviceInstanceId:  creds.resource_instance_id
    };
    const ObjectStore = require('ibm-cos-sdk');
    let cos = new ObjectStore.S3(objectStoreConfig);

    let params = {
        Bucket: creds.bucket_name
    };
    let cardMetaData = await cos.listObjects(params).promise();

        // use the keys to get the data, the get handles the types as needed
    for (const data of cardMetaData.Contents) {
        params.Key = data.Key;
        await cos.deleteObject(params).promise();
    }

};