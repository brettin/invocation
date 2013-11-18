/**
 * @class ForceDirectedNetwork
 *
 * Implements a force-directed network widget
 *
 * And here's an example:
 *
 *     @example
 *     $("#div-id").ForceDirectedNetwork({
 *         minHeight   : "300px",
 *         workspaceID : "workspace.1",
 *         token       : "user-token-53"
 *     });
 *
 * @extends KBWidget
 * @chainable
 *
 * @param {Object} options
 * The options
 *
 * @param {String} options.workspaceID
 * The workspace ID of the network to look up
 *
 * @param {String} options.token
 * The authorization token used for workspace lookup
 *
 * @param {String|Number} options.minHeight
 * A minimum height for the widget
 */
(function($) {
    var URL_ROOT = "http://140.221.84.142/objects/coexpr_test/Networks";
    var WS_URL   = "http://kbase.us/services/workspace_service/";
    $.KBWidget({
        name: "ForceDirectedNetwork",
        parent : 'kbaseAuthenticatedWidget',
        version: "0.1.0",
        options: {
            minHeight: "300px"
        },

        loggedInCallback : function(auth) {
            this.render();
        },

        loggedOutCallback : function(auth) {
            this.$elem.empty();
        },

        loggedInQueryCallback : function(auth) {
            console.log("LIQC");
            this.render();
        },

        setInput : function (workspace) {
            this.options.workspaceID = workspace;
        },

        init: function(options) {
            this._super(options);
            this.render();
            return this;
        },
        render: function () {
            var self = this;
            var fetchAjax = function () { return 1; };
            if (self.options.minHeight) {
                self.$elem.css("min-height", self.options.minHeight);
            }
            if (self.auth().token) {
                var wsRegex = /^(\w+)\.(.+)/;
                var wsid = wsRegex.exec(self.options.workspaceID);
                if (wsid !== null && wsid[1] && wsid[2]) {
                    var kbws = new workspaceService(WS_URL);
                    fetchAjax = kbws.get_object({
                        auth: self.auth().token,
                        workspace: wsid[1],
                        id: wsid[2],
                        type: 'Networks'
                    });
                } else {
                    self.trigger("error", ["Cannot parse workspace ID " +
                        self.options.workspaceID ]);
                    return self;
                }
            } else {
                fetchAjax = $.ajax({
                    dataType: "json",
                    url: URL_ROOT + "/" +
                        encodeURIComponent(self.options.workspaceID) + ".json"
                });
            }
            $.when(fetchAjax).done(function (result) {
                var data = transformNetwork(result.data);
                KBVis.require(["renderers/network"/*, "util/viewport"*/],
                function (Network/*, Viewport*/) {
                    // var viewport = new Viewport({
                    //     parent: self.$elem,
                    //     title: "Network",
                    //     maximize: true
                    // });
                    // viewport.css("min-height", "700px");
                    var network = new Network({
                        element: /* viewport */self.$elem,
                        dock: false,
                        nodeLabel: { type: "GENE" }
                    });
                    network.setData(data);
                    network.render();
                });
            });
            return self;
        }
    });

    function transformNetwork(networkJson) {
        var json = {
            nodes: [],
            edges: []
        };
        var nodeMap = {};
        for (var i = 0; i < networkJson.nodes.length; i++) {
            var node = $.extend({}, networkJson.nodes[i]);
            nodeMap[node.id] = i;
            node.kbid = node.id;
            node.group = node.type;
            node.id = i;
            json.nodes.push(node);
        }
        for (var i = 0; i < networkJson.edges.length; i++) {
            var edge = $.extend({}, networkJson.edges[i]);
            edge.source = parseInt(nodeMap[edge.nodeId1]);
            edge.target = parseInt(nodeMap[edge.nodeId2]);
            edge.weight = 1;
            json.edges.push(edge);
        }
        for (var prop in networkJson) {
            if (!json.hasOwnProperty(prop)) {
                json[prop] = networkJson[prop];
            }
        }
        return json;
    }
})(jQuery);
