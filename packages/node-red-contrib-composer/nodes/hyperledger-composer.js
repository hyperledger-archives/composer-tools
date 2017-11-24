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
    const AssetDeclaration = require('composer-common').AssetDeclaration;
    const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
    const ParticipantDeclaration = require('composer-common').ParticipantDeclaration;
    const TransactionDeclaration = require('composer-common').TransactionDeclaration;

    let connected = false;
    let connecting = false;
    let connectionPromise;
    let businessNetworkConnection = new BusinessNetworkConnection();

    let cardName;
    let businessNetworkDefinition, serializer;

    let listener;

    const RETRIEVE = 'retrieve';

    /**
     * Connects to the business network
     * @param {node} node The node red node currently being invoked
     * @returns {Promise} A promise
     */
    function connectInternal (node) {
        node.log('connectInternal');
        node.log('settings: cardName' + cardName);
        connecting = true;
        connected = false;
        connectionPromise = businessNetworkConnection
            .connect(cardName)
            .then((result) => {
                // setup some objects for this business network
                businessNetworkDefinition = result;
                serializer = businessNetworkDefinition.getSerializer();
            })
            .then(() => {
                connected = true;
                connecting = false;
                node.status({fill : 'green', shape : 'dot', text : 'connected'});
            })
            .catch((error) => {
                connected = connecting = false;
                throw error;
            });
        return connectionPromise;
    }

    /**
     * Ensures you are connected to the business network
     * @param {node} node The node red node currently being invoked
     * @returns {Promise} A promise
     */
    function ensureConnected (node) {
        node.log('ensureConnected');
        if (connected) {
            return Promise.resolve();
        } else if (connecting) {
            return connectionPromise;
        } else {
            return connectInternal(node);
        }
    }

    /**
     * Subscribe to events from a business network
     * @param {node} node The node red node currently being invoked
     * @returns {Promise} A promise
     */
    function subscribeToEvents (node) {
        node.log('subscribe');

        return ensureConnected(node)
            .then(() => {
                node.status({fill : 'green', shape : 'dot', text : 'connected'});
                node.log('subscribed');
                businessNetworkConnection.on('event', listener = (event) => {
                    let serializer = businessNetworkDefinition.getSerializer();
                    let deserializedEvent = serializer.toJSON(event);
                    node.log('received event ' + JSON.stringify(deserializedEvent));
                    node.send(deserializedEvent);

                });
            });
    }

    /**
     * Create an instance of an object in Composer. For assets, this method
     * adds the asset to the default asset registry. For transactions, this method
     * submits the transaction for execution.
     * @param {object} data The data that is going to be created on the blockchain
     * @param {node} node The node red node currently being invoked
     * @returns {Promise} A promise
     */
    function create (data, node) {
        node.log('create ' + JSON.stringify(data));

        return ensureConnected(node)
            .then(() => {
                node.log('connected');
                // Convert the JSON data into a resource.
                let serializer = businessNetworkDefinition.getSerializer();
                let resource = serializer.fromJSON(data);
                // The create action is based on the type of the resource.
                let classDeclaration = resource.getClassDeclaration();
                if (classDeclaration instanceof AssetDeclaration) {
                    node.log('creating asset');
                    // For assets, we add the asset to its default asset registry
                    return businessNetworkConnection.getAssetRegistry(classDeclaration.getFullyQualifiedName())
                        .then((assetRegistry) => {
                            node.log('Got asset registry');
                            return assetRegistry.add(resource);
                        })
                        .then(() => {
                            node.log('added asset');
                        })
                        .catch((error) => {
                            node.error(error.message);
                        });

                } else if (classDeclaration instanceof TransactionDeclaration) {
                    node.log('creating transaction');
                    // For transactions, we submit the transaction for execution.
                    return businessNetworkConnection.submitTransaction(resource)
                        .then(() => {
                            node.log('submitted transaction successfully');
                        })
                        .catch((error) => {
                            node.error(error.message);
                        });

                } else if (classDeclaration instanceof ParticipantDeclaration) {
                    node.log('creating participant');
                    return businessNetworkConnection.getParticipantRegistry(classDeclaration.getFullyQualifiedName())
                        .then((participantRegistry) => {
                            node.log('got participant registry');
                            return participantRegistry.add(resource);
                        })
                        .then(() => {
                            node.log('added participant');
                        })
                        .catch((error) => {
                            node.error(error.message);
                        });
                } else {
                    // For everything else, we blow up!
                    node.error(`Unable to handle resource of type: ${typeof classDeclaration}`);
                }
            })
            .catch((error) => {
                throw new Error('creating resource error ' + error.message);
            });
    }

    /**
     * Get an instance of an object in Composer. For assets, this method
     * gets the asset from the default asset registry.
     * @param {object} data The data to be retrieved from the blockchain
     * @param {node} node The node red node currently being invoked
     * @returns {Promise} A promise
     */
    function retrieve (data, resolve, node) {
        node.log('retrieve ' + JSON.stringify(data));

        let modelName = data.$class;
        let id = data.id;

        return ensureConnected(node)
            .then(() => {
                node.log('connected');
                let modelManager = businessNetworkDefinition.getModelManager();
                let classDeclaration = modelManager.getType(modelName);

                if (classDeclaration instanceof AssetDeclaration) {
                    // For assets, we add the asset to its default asset registry.
                    return businessNetworkConnection.getAssetRegistry(modelName)
                        .then((assetRegistry) => {
                            node.log('got asset registry');

                            if (resolve) {
                                if (id == null) {
                                  return assetRegistry.resolveAll();
                                }
                                else {
                                  return assetRegistry.resolve(id);
                                }
                            } else {
                              if (id == null) {
                                return assetRegistry.getAll();
                              }
                              else {
                                return assetRegistry.get(id);
                              }
                            }
                        })
                        .then((result) => {
                            node.log('got asset');
                            if (resolve) {
                                return result;
                            } else {
                                return serializer.toJSON(result);
                            }
                        })
                        .catch((error) => {
                            throw error;
                        });
                } else if (classDeclaration instanceof ParticipantDeclaration) {
                    // For participants, we add the participant to its default participant registry.
                    return businessNetworkConnection.getParticipantRegistry(modelName)
                        .then((participantRegistry) => {
                            node.log('got participant registry');
                            if (id == null) {
                                return assetRegistry.resolveAll();
                            }
                            else {
                              return participantRegistry.get(id);
                            }
                        })
                        .then((result) => {
                            node.log('got participant');
                            return serializer.toJSON(result);
                        })
                        .catch((error) => {
                            throw(error);
                        });
                } else {
                    // For everything else, we blow up!
                    throw new Error(`Unable to handle resource of type: ${typeof classDeclaration}`);
                }
            })
            .catch((error) => {
                throw new Error('retrieving resource error ' + error.message);
            });
    }

    /**
     * Update an instance of an object in Composer. For assets, this method
     * updates the asset to the default asset registry.
     * @param {data} data The data to be updated on the blockchain
     * @param {node} node The node red node currently being invoked
     * @returns {Promise} A promise
     */
    function update (data, node) {
        node.log('update ' + JSON.stringify(data));

        return ensureConnected(node)
            .then(() => {
                node.log('connected');
                // Convert the JSON data into a resource.
                let serializer = businessNetworkDefinition.getSerializer();
                let resource = serializer.fromJSON(data);

                // The create action is based on the type of the resource.
                let classDeclaration = resource.getClassDeclaration();
                if (classDeclaration instanceof AssetDeclaration) {
                    // For assets, we add the asset to its default asset registry.
                    return businessNetworkConnection.getAssetRegistry(classDeclaration.getFullyQualifiedName())
                        .then((assetRegistry) => {
                            node.log('Got asset registry');
                            return assetRegistry.update(resource);
                        })
                        .then(() => {
                            node.log('updated asset');
                        })
                        .catch((error) => {
                            throw(error);
                        });
                } else if (classDeclaration instanceof ParticipantDeclaration) {
                    // For participants, we add the participant to its default participant registry.
                    return businessNetworkConnection.getParticipantRegistry(classDeclaration.getFullyQualifiedName())
                        .then((participantRegistry) => {
                            node.log('got participant registry');
                            return participantRegistry.update(resource);
                        })
                        .then(() => {
                            node.log('updated participant');
                        })
                        .catch((error) => {
                            throw(error);
                        });
                } else {
                    // For everything else, we blow up!
                    throw new Error(`Unable to handle resource of type: ${typeof classDeclaration}`);
                }
            })
            .catch((error) => {
                throw new Error('updating resource error ' + error.message);
            });
    }

    /**
     * Delete an instance of an object in Composer. For assets, this method
     * deletes the asset to the default asset registry.
     * @param {data} data The data to be updated on the blockchain
     * @param {node} node The node red node currently being invoked
     * @returns {Promise} A promise
     */
    function remove (data, node) {
        node.log('delete ' + JSON.stringify(data));

        let modelName = data.$class;
        let id = data.id;

        return ensureConnected(node)
            .then(() => {
                node.log('connected');
                // The create action is based on the type of the resource.
                let modelManager = businessNetworkDefinition.getModelManager();
                let classDeclaration = modelManager.getType(modelName);
                if (classDeclaration instanceof AssetDeclaration) {
                    // For assets, we add the asset to its default asset registry.
                    let assetRegistry;
                    return businessNetworkConnection.getAssetRegistry(classDeclaration.getFullyQualifiedName())
                        .then((_assetRegistry) => {
                            assetRegistry = _assetRegistry;
                            node.log('Got asset registry');
                            return assetRegistry.get(id);
                        })
                        .then((resource) => {
                            return assetRegistry.remove(resource);
                        })
                        .then(() => {
                            node.log('removed asset');
                        })
                        .catch((error) => {
                            throw(error);
                        });
                } else if (classDeclaration instanceof ParticipantDeclaration) {
                    // For participants, we add the participant to its default participant registry.
                    let participantRegistry;
                    return businessNetworkConnection.getParticipantRegistry(classDeclaration.getFullyQualifiedName())
                        .then((_participantRegistry) => {
                            participantRegistry = _participantRegistry;
                            node.log('got participant registry');
                            return participantRegistry.get(id);
                        })
                        .then((resource) => {
                            return participantRegistry.remove(resource);
                        })
                        .then(() => {
                            node.log('removed participant');
                        })
                        .catch((error) => {
                            throw(error);
                        });
                } else {
                    // For everything else, we blow up!
                    throw new Error(`Unable to handle resource of type: ${typeof classDeclaration}`);
                }
            })
            .catch((error) => {
                throw new Error('deleting resource error ' + error.message);
            });
    }

    /**
     * Checks the config that is set on the node is correct
     * @param {object} config The config set on the node
     * @returns {Promise} A promise
     */
    function checkConfig (config) {
        return Promise.resolve().then(() => {

            if (!config.cardName) {
                throw new Error('card name must be set');
            }

            return '';
        });
    }

    /**
     * Check that the message payload contains the correct data
     * @param {object} payLoad The message payload that is passed from the previous node
     * @param {string} type The operation type either update, create or retrieve
     * @returns {Promise} A promise
     */
    function checkPayLoad (payLoad, type) {
        return Promise.resolve().then(() => {
            if (!payLoad.$class) {
                throw new Error('$class not set in payload');
            }
        });
    }

    /**
     * Create a output node
     * @param {object} config The configuration from the node
     * @constructor
     */
    function HyperledgerComposerOutNode (config) {
        let node = this;
        RED.nodes.createNode(node, config);

        node.on('input', function (msg) {
            node.log('config ' + config.composerCard);
            this.composer = RED.nodes.getNode(config.composerCard);
            node.log('checking config' + this.composer);
            checkConfig(this.composer)
                .then(() => {
                    cardName = this.composer.cardName;

                    node.log('checking payload');
                    return checkPayLoad(msg.payload, config.actionType);
                })
                .then(() => {
                    if (config.actionType === 'create') {
                        return create(msg.payload, node);
                    } else if (config.actionType === 'update') {
                        return update(msg.payload, node);
                    } else if (config.actionType === 'delete') {
                        return remove(msg.payload, node);
                    } else {
                        throw new Error('Error: action type ' + config.actionType + ' is not valid');
                    }
                })
                .catch((error) => {
                    node.status({fill : 'red', shape : 'dot', text : 'Error'});
                    node.error('Error: ' + error.message);
                });

            node.on('close', () => {
                node.status({});
            });
        });
    }

    RED.nodes.registerType('hyperledger-composer-out', HyperledgerComposerOutNode);

    /**
     * Create a mid node
     * @param {object} config The configuration set on the node
     * @constructor
     */
    function HyperledgerComposerMidNode (config) {
        let node = this;
        RED.nodes.createNode(node, config);

        node.on('input', function (msg) {
            node.log('checking config');
            this.composer = RED.nodes.getNode(config.composerCard);
            checkConfig(this.composer)
                .then(() => {
                    cardName = this.composer.cardName;

                    return checkPayLoad(msg.payload, config.actionType);

                })
                .then(() => {
                    if (config.actionType === 'create') {
                        return create(msg.payload, node);
                    } else if (config.actionType === 'update') {
                        return update(msg.payload, node);
                    } else if (config.actionType === 'delete') {
                        return remove(msg.payload, node);
                    } else if (config.actionType === 'retrieve') {
                        return retrieve(msg.payload, config.resolve, node);
                    } else {
                        throw new Error('action type ' + config.actionType + ' is not valid');
                    }
                })
                .then((result) => {
                    node.log('got a result');
                    msg.payload = result;
                    node.status({});
                    node.send(msg);
                })
                .catch((error) => {
                    node.status({fill : 'red', shape : 'dot', text : 'Error'});
                    node.error('Error: ' + error.message);
                });

            node.on('close', () => {
                node.status({});
            });
        });
    }

    RED.nodes.registerType('hyperledger-composer-mid', HyperledgerComposerMidNode);

    /**
     * Create an in node
     * @param {object} config The configuration set on the node
     * @constructor
     */
    function HyperledgerComposerInNode (config) {
        let node = this;
        RED.nodes.createNode(node, config);
        this.composer = RED.nodes.getNode(config.composerCard);
        node.log('checking config');
        checkConfig(this.composer)
            .then(() => {
                cardName = this.composer.cardName;

                return subscribeToEvents(node);

            })
            .catch((error) => {
                node.status({fill : 'red', shape : 'dot', text : 'error'});
                node.log(error.message);
                node.error('Error: ' + error.message);
            });

        node.on('close', () => {
            node.status({fill : 'red', shape : 'ring', text : 'disconnected'});
            node.log('node was closed so removed event listener');
            businessNetworkConnection.removeListener('event', listener);
        });

    }

    RED.nodes.registerType('hyperledger-composer-in', HyperledgerComposerInNode);
};
