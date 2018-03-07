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
    { c: null, text: 'Need configuration' }];

module.exports.correctConfigs=[
    {
        'database': 'alpha-metal',
        'username': creds.username,
        'password': creds.password,
        'host': creds.host,
        'port': creds.port,
        'url': creds.url
    }
];
module.exports.clean=async ()=>{

    let Cloudant = require('@cloudant/cloudant');

// Initialize the library with my account.
    let cloudant = Cloudant({account:creds.username, password:creds.password,plugins: 'promises' });
    try {
        await cloudant.db.destroy('alpha-metal');
    } catch (err) {
        if (err.statusCode === 404){
            //ok if db not there
        }else {
            throw err;
        }
        // console.log(err._response);
    }

    await cloudant.db.create('alpha-metal');


};