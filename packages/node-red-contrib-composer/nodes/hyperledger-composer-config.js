module.exports = function(RED) {
    function HyperledgerComposerConfigNode(n) {
        RED.nodes.createNode(this,n);
        this.cardName = n.cardName;
    }
    RED.nodes.registerType("hyperledger-composer-config",HyperledgerComposerConfigNode);
};
