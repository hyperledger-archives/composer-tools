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
module.exports = function (RED) {
    const util = require('util');
    const exec = util.promisify(require('child_process').exec);
    const formidable = require('formidable');
    const fs = require('fs');

    const AdminConnection = require('composer-admin').AdminConnection;
    const IdCard = require('composer-common').IdCard;

    let adminConnection;

    /**
     * Get a list of available cards
     * @param {cardStoreConfig} cardStoreConfig The card config to be used
     * @returns {Promise} A promise
     */
    function getCards (cardStoreConfig) {
        adminConnection = new AdminConnection(cardStoreConfig.composer);
        return adminConnection.getAllCards();
    }

    /**
     * Adds a card to the card store
     * @param {cardStoreConfig} cardStoreConfig The card config to be used
     * @param {card} card The card to add
     * @param {cardName} cardName The name to call the card
     * @returns {Promise} A promise
     */
    function addCard (cardStoreConfig, card, cardName) {
        adminConnection = new AdminConnection(cardStoreConfig.composer);
        let name;
        if (cardName && cardName !== '') {
            name = cardName;
        } else {
            const locationName = card.getBusinessNetworkName() || card.getConnectionProfile().name;
            name = card.getUserName() + '@' + locationName;
        }

        return adminConnection.importCard(name, card).then(() => {
            return name;
        });
    }

    /**
     *
     * @param {n} n The node
     * @returns {Promise} A promise
     * @constructor
     */
    function HyperledgerComposerConfigNode (n) {
        RED.nodes.createNode(this, n);

        let data = {};
        data.cardName = n.cardName;
        data.cardStoreLocation = n.cardStoreLocation;

        if (!n.cardStoreConfig || n.cardStoreLocation === 'local') {
            this.ready = Promise.resolve()
                .then(() => {
                    data.cardStoreConfig = {};
                    return data;
                });
        } else {
            data.cardStoreConfig = JSON.parse(n.cardStoreConfig);
            this.log('about to install npm module ' + data.cardStoreConfig.composer.wallet.type);
            this.ready = exec('npm install ' + data.cardStoreConfig.composer.wallet.type)
                .then((stdout, stderr) => {
                    if (stderr) {
                        throw new Error(stderr);
                    }

                    this.log('finished installing npm module ' + util.inspect(stdout, false, null));
                    return data;
                })
                .catch((error) => {
                    this.status({fill : 'red', shape : 'dot', text : 'error'});
                    this.log(error.message);
                });
        }

        return this;
    }

    /**
     *
     * @returns {*} new form processor
     */
    function createIncomingForm () {
        return new formidable.IncomingForm();
    }

    RED.nodes.registerType('hyperledger-composer-config', HyperledgerComposerConfigNode);

    RED.httpAdmin.get('/composercards', RED.auth.needsPermission('hyperledger-composer-config.read'), function (req, res) {
        return getCards(req.query)
            .then((cards) => {
                let cardList = Array.from(cards.keys()).sort(function (a, b) {
                    return a.toLowerCase() > (b.toLowerCase());
                });
                res.json(cardList);
            }).catch((error) => {
                return res.status(500).send(error.message);
            });
    });

    RED.httpAdmin.post('/composercards', RED.auth.needsPermission('hyperledger-composer-config.read'), function (req, res) {
        const form = createIncomingForm();
        let cardStoreConfig;
        let cardName;
        return new Promise((resolve, reject) => {
            form.parse(req, (err, fields, files) => {
                if (err) {
                    console.log(err);
                    return reject(err);
                }

                cardStoreConfig = JSON.parse(fields.cardStoreConfig);
                cardName = fields.cardName;
                return resolve(files.file);
            });
        }).then((file) => {
            return new Promise((resolve, reject) => {
                fs.readFile(file.path, (err, data) => {
                    if (err) {
                        return reject(err);
                    }
                    return resolve(data);
                });
            });
        }).then((cardData) => {
            return IdCard.fromArchive(cardData);
        }).then((card) => {
            return addCard(cardStoreConfig, card, cardName);
        }).then((cardName) => {
            return res.send(cardName);
        }).catch((error) => {
            return res.status(500).send(error);
        });
    });
};
