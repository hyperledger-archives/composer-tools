module.exports = function(RED) {
    function HyperledgerComposerConfigNode(n) {
        RED.nodes.createNode(this,n);
        this.connectionProfile = n.connectionProfile;
        this.businessNetworkIdentifier = n.businessNetworkIdentifier;
        this.userID = n.userID;
        this.userSecret = n.userSecret;
    }
    RED.nodes.registerType("hyperledger-composer-config",HyperledgerComposerConfigNode);
}