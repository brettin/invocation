/**
 * Made to work with the landing page.
 * This initializes all card positions relative to the #app div.
 *
 * It manages all cards and widgets, organizes which data is available,
 * and (with available handlers) exports data to the user's workspace.
 */

(function( $, undefined ) {
    $.KBWidget({
        name: "KBaseCardLayoutManager",
        parent: "kbaseWidget",
        version: "1.0.0",
        options: {
            template: null,
            data: {},
            auth: null,
            userId: null,
            loadingImage: "../widgets/images/ajax-loader.gif",
        },
        cardIndex: 0,
        cards: {},
        defaultLocation: "CDS",
        defaultWidth: 300,

        workspaceURL: "https://www.kbase.us/services/workspace",
        fbaURL: "https://www.kbase.us/services/fba_model_services",
        workspaceClient: null,
        fbaClient: null,        // used to export CDS genomes to workspace.

        /**
         * Initializes this widget
         */
        init: function(options) {
            this._super(options);

            this.workspaceClient = new workspaceService(this.workspaceURL);
            this.fbaClient = new fbaModelServices(this.fbaURL);

            $.ui.dialog.prototype._makeDraggable = function() {
                this.uiDialog.draggable({
                    containment: false
                });
            };

            // allow html in dialog title bar
            // safe, since they're not user-generated or modified
            // http://stackoverflow.com/questions/14488774/using-html-in-a-dialogs-title-in-jquery-ui-1-10
            $.widget("ui.dialog", $.extend({}, $.ui.dialog.prototype, {
                _title: function(title) {
                    if (!this.options.title ) {
                        title.html("&#160;");
                    } else {
                        title.html(this.options.title);
                    }
                }
            }));

            var self = this;
            $(document).on("kbaseCardClosed", function(event, id) {
                self.cardClosed(id);
            });

            this.render();
            this.registerEvents();
            this.showInitialCards();
            return this;
        },

        /**
         * Renders the control box panel.
         * This is optional, so it's (currently) kept separate from the init function.
         */
        render: function(options) {
            this.initControlBox();
            $("#app").append(this.$controlBox);

            this.initExportModal();
            this.$elem.append(this.exportModal.modal);

            return this;
        },

        initExportModal: function() {
            var $body = $("<div class='modal-body'></div>");
            var $okButton = $("<button type='button' class='btn btn-primary'>Export</button>");

            var $modal = $("<div class='modal fade'>")
                         .append($("<div class='modal-dialog'>")
                                 .append($("<div class='modal-content'>")
                                         .append($("<div class='modal-header'>")
                                                 .append($("<h4 class='modal-title'>Export data?</h4>"))
                                                )
                                         .append($body)
                                         .append($("<div class='modal-footer'>")
                                                 .append($("<button type='button' class='btn btn-default' data-dismiss='modal'>Cancel</button>"))
                                                 .append($okButton)
                                                 )
                                         )
                                 );

            var $loadingDiv = $("<div style='width: 100%; text-align: center; padding: 20px'><img src=" + this.options.loadingImage + "/><br/>Exporting data. This may take a moment...</div>");

            var exportModal = {
                modal: $modal,
                body: $body,
                okButton: $okButton,
                loadingDiv: $loadingDiv
            };

            this.exportModal = exportModal;
        },

        /**
         * Initializes the control panel menu that sits in the upper-right corner.
         * Currently only has one working function - show the data manager.
         *
         * Soon, there'll be a way to save and load the card layouts.
         */
        initControlBox: function() {
            var self = this;
            var makeMenuItem = function(text, action) {
                var $item = $("<li />")
                            .attr("role", "presentation")
                            .append($("<a />")
                                    .attr("role", "menuitem")
                                    .attr("tabindex", "-1")
                                    .append(text)
                                    .on("click", $.proxy(self, action) )
                                    );
                return $item;
            };


            var $dropdown = $("<div/>")
                            .addClass("dropdown")
                            .addClass("pull-right")
                            .append($("<button>")
                                    .attr("data-toggle", "dropdown")
                                    .addClass("btn btn-primary")
                                    .append("<span class='glyphicon glyphicon-cog'/> <span class='caret'></span>")
                                    )
                            .append($("<ul>")
                                    .addClass("dropdown-menu pull-right")
                                    .attr("role", "menu")
                                    .attr("aria-labelledby", "dLabel")
                                    .append(makeMenuItem("Manage Data", "toggleDataManager"))
                                    .append(makeMenuItem("Save Layout", "saveLayout").addClass("disabled"))
                                    .append(makeMenuItem("Load Layout", "loadLayout").addClass("disabled"))
                                    );

            this.$dataManager = this.makeDataManager();

            this.$dataManager.hide();

            this.$controlBox = $("<div class='container'/>")
                               .addClass("kblpc-control-box")
                               .append($("<div class='row'>").append($dropdown))
                               .append(this.$dataManager);
        },

        /**
         * Builds the data manager panel.
         */
        makeDataManager: function() {
            var self = this;
            var $header = $("<div/>")
                          .addClass("panel-heading")
                          .append($("<span/>")
                                  .addClass("panel-title")
                                  .append("Data Manager ")
                                 )
                          .append($("<a/>")
                                  .append($("<span/>")
                                          .addClass("glyphicon glyphicon-remove pull-right")
                                          .on("click", function(event) { self.toggleDataManager(); })
                                          )
                                 );
            var $buttonPanel = $("<div/>")
                               .addClass("btn-group btn-group-sm")
                               .append($("<button/>")
                                       .on("click", function(event) { self.toggleSelectAll($(event.currentTarget)); })
                                       .addClass("btn btn-default")
                                       .append($("<span/>")
                                               .addClass("glyphicon glyphicon-check")
                                               )
                                       )
                               .append($("<button class='btn btn-default'>")
                                       .append("Export selected")
                                       .on("click", function(event) { self.exportToWorkspace(); })
                                       );

            var $body = $("<div/>")
                        .addClass("panel-body kblpc-manager")
                        .append($buttonPanel);

            var $dm = $("<div/>")
                      .addClass("row")
                      .append($("<div/>")
                              .addClass("panel panel-default")
                              .append($header)
                              .append($body));

            return $dm;
        },

        toggleSelectAll: function($target) {
            // check off everything.
            if ($target.find("> .glyphicon").hasClass("glyphicon-check")) {
                $(".kblpc-manager-dataset > div > table > tbody > tr > td > input").prop('checked', true);
            }
            // uncheck everything.
            else {
                $(".kblpc-manager-dataset > div > table > tbody > tr > td > input").prop('checked', false);
            }

            $target.find("> .glyphicon").toggleClass("glyphicon-check glyphicon-unchecked");
        },

        updateDataManager: function() {
            if (!this.$dataManager)
                return;

            // get the loaded data
            var dataHash = this.getDataObjectsHash();

            // now we have a hash of all data present.
            // make some html out of it.
            var dataTypes = [];
            for (var k in dataHash) {
                if (dataHash.hasOwnProperty(k))
                    dataTypes.push(k);
            }
            dataTypes.sort();

            var $dm = this.$dataManager.find(".kblpc-manager");

            /**
             * Each datatype gets its own block ($dataBlock)
             * Each block has a header and a dataSet.
             * The header does some funkiness where it toggles which way the pointer chevron is pointing.
             * When the header is clicked it toggles the display of its corresponding dataset.
             */
            $.each(dataTypes, function(i, type) {
                var underscoreType = type.replace(" ", "_");

                var $dataBlock = $dm.find(".kblpc-manager-dataset[data-type='" + type + "']");

                if ($dataBlock.length === 0) {
                    // make a new datablock - this is the enclosing div
                    // for the section containing a header (with data type and count)
                    // and chevron for expanding/collapsing.
                    $dataBlock = $("<div/>")
                                     .addClass("kblpc-manager-dataset")
                                     .attr("data-type", type);

                    // The chevron is just a glyphicon.
                    var $chevron = $("<span/>")
                                   .addClass("glyphicon glyphicon-chevron-down");

                    // The header contains the name of the data type and number of objects
                    var $dataHeader = $("<div/>")
                                      .addClass("row")
                                      .append($("<a/>")
                                              .attr("data-toggle", "collapse")
                                              .attr("data-target", "#kblpc-" + underscoreType)
                                              .append($chevron)
                                              .append(" " + type + " (<span id='kblpc-count'>" + dataHash[type].length + "</span>)")
                                            );

                    // The dataset is the meat of the table, the collapsible list of data object ids.
                    var $dataSetRow = $("<div/>")
                                   .attr("id", "kblpc-" + underscoreType)
                                   .attr("data-type", type)
                                   .addClass("row collapse in")
                                   .on("hidden.bs.collapse", { chevron: $chevron }, 
                                        function(event) {
                                            event.data.chevron.toggleClass("glyphicon-chevron-down");
                                            event.data.chevron.toggleClass("glyphicon-chevron-right");
                                        }
                                    )
                                   .on("shown.bs.collapse", { chevron: $chevron }, 
                                        function(event) {
                                            event.data.chevron.toggleClass("glyphicon-chevron-down");
                                            event.data.chevron.toggleClass("glyphicon-chevron-right");
                                        }
                                    )
                                   .append($("<table/>")
                                           .addClass("table"));

                    $dataBlock.append($dataHeader)
                              .append($dataSetRow);

                    $dm.append($dataBlock);
                }
                else {
                    $dataBlock.find("> div > a > span#kblpc-count").html(dataHash[type].length);
                }

                var $dataSet = $dataBlock.find("> div#kblpc-" + underscoreType + " > table");

                // search for what needs to be synched.
                // 1. hash the list of ids
                var dataIdHash = {};
                $.each(dataHash[type], function(j, id) {
                    dataIdHash[id] = 1;
                });

                // 2. hash the displayed elements
                var dataDivHash = {};
                $.each($dataSet.find("> tbody > tr"), function(j, child) {
                    var ws = $(child).find(":last-child").html();
                    var id = $(child).find(":nth-child(2)").html();
                    dataDivHash[ws + ":" + id] = $(child);
                });

                // 3. if it's in the idhash, and not the displayed hash, add it to the display.
                $.each(dataHash[type], function(j, wsId) {
                    if (!dataDivHash.hasOwnProperty(wsId)) {
                        var parts = wsId.split(':');
                        var ws = parts.shift();
                        var id = parts.join(':');

                        var $dataDiv = $("<tr/>")
                                       .addClass("pull-left")
                                       .append($("<td><input type='checkbox'></td> "))
                                       .append($("<td>" + id + "</td>"))
                                       .append($("<td>" + ws + "</td>"));
                        $dataSet.append($dataDiv);
                    }
                });

                // 4. if it's in the displayed hash and not the id hash, remove it from the display.
                $.each(dataDivHash, function(key, value) {
                    if (!dataIdHash.hasOwnProperty(key)) {
                        value.remove();
                    }
                });
            });

            // at the very very end, remove any blocks that don't match to any current datatypes
            // i.e.: those blocks whose last card was just removed.

            $.each($(".kblpc-manager-dataset"), function(i, element) {
                if (!dataHash.hasOwnProperty($(element).attr("data-type")))
                    $(element).remove();
            });
        },

        /**
         * Exports the selected data elements to the user's workspace.
         */
        exportToWorkspace: function() {
            // 1. Get the data to export.
            var exportData = {};

            /* Probably not optimal, but it scrapes the data to export out of
             * the HTML tables.
             * It might be best to store everything being displayed, but that's just something
             * else to keep updated on each change.
             * And we need to check what's selected anyway. This is probably more efficient.
             * Still kinda ugly, though.
             */
            $.each($(".kblpc-manager-dataset"), function(i, element) {
                var type = $(element).attr("data-type");
                $.each($(element).find("> div[data-type='" + type + "'] > table > tbody > tr"), function(j, row) {
                    if ($(row).find(":first-child > input").prop("checked")) {
                        if (!exportData.hasOwnProperty(type))
                            exportData[type] = [];

                        var ws = $(row).find(":nth-child(3)").html();
                        var id = $(row).find(":nth-child(2)").html();
                        exportData[type].push({'id': id, 'workspace': ws});

                    }
                });
            });

            var self = this;
            var doExport = function() {
                self.exportModal.body.append(self.exportModal.loadingDiv);

                var jobsList = [];
                for (var type in exportData) {
                    var exportCommand = "_export" + type;
                    jobsList = jobsList.concat(self[exportCommand](exportData[type]));
                }

                $.when.apply($, jobsList).done(function() {
                    self.exportModal.modal.modal('hide');
                    console.log("Done exporting genomes!");
                });
            };


            /*
             * Now we have the data, so make an "Are you REALLY sure?" modal.
             * If the user says yes, modify it to show a progress bar or something.
             */
            var exportWs = this.options.userId + "_home";

            if (Object.keys(exportData).length === 0) {
                this.exportModal.body.html("No data selected for export!");
                this.exportModal.okButton.addClass("hide");
            }
            else {
                var $bodyHtml = "Export selected data to workspace '<b>" + exportWs + "</b>'?";
                this.exportModal.body.html($bodyHtml);
                this.exportModal.okButton.removeClass("hide");
                this.exportModal.okButton.click(function(event) { doExport(); });
            }
            this.exportModal.modal.modal({'backdrop': 'static', 'keyboard': false});


            // Each data type needs an export handler. Might need to be handled elsewhere?
            // Or at least handled later.

            /**
             * An exporter should queue up the list of objects to be exported via 
             * the standard KBase Javascript API calls, or by other workspace-related calls.
             *
             * However they're done, this should return an array of AJAX promises.
             */
            // var jobsList = [];
            // for (var type in exportData) {
            //     var exportCommand = "_export" + type;
            //     this[exportCommand](exportData[type]);
            // }


        },

        _exportGenome: function(data) {
            console.log("Exporting genomes");
            console.log(data);
            console.log(this.options.auth);

            var exportWs = this.options.userId + "_home";
            console.log(exportWs);

            // capture the list of async workspace api calls.
            var exportJobs = [];

            for (var i=0; i<data.length; i++) {
                var obj = data[i];
                if (obj.workspace === this.defaultLocation) {
                    console.log("exporting central store genome " + obj.id + " to workspace");
                    exportJobs.push(this.fbaClient.genome_to_workspace(
                        {
                            genome: obj.id,
                            workspace: exportWs,
                            auth: this.options.auth
                        },
                        function(objectMeta) {
                            console.log(objectMeta);
                        },
                        this.clientError
                    ));
                }
                else {
                    console.log("copying workspace genome " + obj.ws + ":" + obj.id + " to workspace");
                }
            }

            return exportJobs;
        },

        clientError: function(error) {
            console.log("A client error occurred: ");
            console.log(error);
        },

        _exportDescription: function(data) {
            console.log("Exporting description");
            console.log(data);
        },

        _exportContig: function(data) {
            console.log("Exporting contigs");
            console.log(data);
        },

        _exportFeature: function(data) {
            console.log("Exporting genes");
            console.log(data);
        },

        /**
         * Toggles the data manager div
         */
        toggleDataManager: function() {
            this.$dataManager.toggle();
        },

        /**
         * Saves the card layout to the user state space.
         */
        saveLayout: function() {
            window.alert("save layout");
        },

        /**
         * Loads a layout from the user state space.
         */
        loadLayout: function() {
            window.alert("load layout");
        },


        showInitialCards: function() {
            if (this.options.template.toLowerCase() === "genome")
                this.showGenomeCards();
            // else if (this.options.template.toLowerCase() === "hello")
            //     this.showHelloCards();
            else {
                // throw an error. modal dialog, maybe?
            }
        },

        /**
         * This is just left in here as an example stub. Not actually used.
         */
        showHelloCards: function() {
            this.addNewCard("HelloWidget",
                {
                    color: this.options.data.color,
                },
                {
                    my: "left top",
                    at: "left bottom",
                    of: "#app"
                }
            );

        },

        /**
         * Initial template for showing genome cards.
         * Shows a genome overview and a description card.
         */
        showGenomeCards: function() {
            this.addNewCard("KBaseGenomeOverview", 
                { 
                    genomeID: this.options.data.genomeID,
                    loadingImage: "../../widgets/images/ajax-loader.gif",
                    isInCard: true
                },
                {
                    my: "left top",
                    at: "left bottom",
                    of: "#app"
                }
            );

            this.addNewCard("KBaseWikiDescription",
                {
                    genomeID: this.options.data.genomeID,
                    loadingImage: "../../widgets/images/ajax-loader.gif",
                },
                {
                    my: "left top",
                    at: "left+330 bottom",
                    of: "#app"
                }
            );
            return this;
        },

        /**
         * Registers all events that this manager should know about.
         * Also makes a list of all registered events, stored in this.registeredEvents[], so they
         * can be unregistered.
         */
        registerEvents: function() {
            var self = this;

            this.registeredEvents = ["featureClick", "showContig", "showDomains", "showOperons", "showBiochemistry"];

            /**
             * Event: showDomains
             * ------------------
             * Adds new KBaseGeneDomains card.
             */
            $(document).on("showDomains", function(event, data) {
                self.addNewCard("KBaseGeneDomains",
                {
                    featureID: data.featureID
                },
                {
                    my: "left top",
                    at: "center",
                    of: data.event
                });
            });

            /**
             * Event: showOperons
             * ------------------
             * Adds new KBaseGeneOperon card, based on the feature that was clicked.
             */
            $(document).on("showOperons", function(event, data) {
                self.addNewCard("KBaseGeneOperon",
                {
                    featureID: data.featureID,
                    loadingImage: "../../widgets/images/ajax-loader.gif",
                },
                {
                    my: "left top",
                    at: "center",
                    of: data.event
                });
            });

            /**
             * Event: showBiochemistry
             * -----------------------
             * Adds new KBaseGeneBiochemistry card, based on a feature ID.
             */            
            $(document).on("showBiochemistry", function(event, data) {
                self.addNewCard("KBaseGeneBiochemistry",
                {
                    featureID: data.featureID
                },
                {
                    my: "left top",
                    at: "center",
                    of: data.event
                });
            });

            /**
             * Event: featureClick
             * -------------------
             * Adds cards based on clicking on a feature.
             */
            $(document).on("featureClick", function(event, data) {
                self.addNewCard("KBaseGeneInfo", 
                    { 
                        featureID: data.feature.feature_id, 
                    },
                    {
                        my: "left top",
                        at: "center",
                        of: data.featureElement
                    }
                );

                self.addNewCard("KBaseGeneInstanceInfo",
                    {
                        featureID: data.feature.feature_id,
                    },
                    {
                        my: "left top",
                        at: "center",
                        of: data.featureElement
                    }
                );
            });

            /**
             * Event: showContig
             * -----------------
             * Adds new KBaseContigBrowser card for a given contig ID,
             * and centered on a feature (if one's available).
             */
            $(document).on("showContig", function(event, data) {
                self.addNewCard("KBaseContigBrowser",
                    {
                        contig: data.contig,
                        showButtons: true,
                        loadingImage: "../../widgets/images/ajax-loader.gif",
                        centerFeature: data.centerFeature
                    },
                    {
                        my: "left top",
                        at: "center",
                        of: data.event
                    }
                );
            });

            $(document).on("helloClick", function(event, data) {
                window.alert(data.message);
            })
        },

        /**
         * Adds a new card to the layout manager. This needs three parameters:
         * 1. cardName - the name of the card widget to be invoked. E.g. 'KBaseGenomeOverview' for the
         *               Genome Overview widget.
         * 2. options - the options object to be passed to the card.
         * 3. position - a jQuery-UI position object for the initial position to put the card.
         *               See the jquery-ui position docs for details.
         */
        addNewCard: function(cardName, options, position) {
            /** position = optional. if none given, it puts the new card in the center of the page **/

            /* NOTE - later, have it manage where the new card comes in here.
             *
             * Should be a way to use the dialog/position jqueryUI stuff.
             * Something like:
             * 
             * $("#id").dialog({
             *      position: {
             *          my: 'top',
             *          at: 'top',
             *          of: $("#initializing element")
             *      }
             * });
             *
             * Would need to pass in whatever's the initializer, i.e. the
             * card that wants to spawn a new one. Or null (or maybe $(window)?)
             * to make it relative to the page.
             */

            /*
             * When we make a new card, we store it in the manager like this:
             * cards[cardId] = {
             *     card: <the kbaseLandingCard>
             *     data: <the widget embedded in the card>
             * }
             *
             * This implies that each widget to be used in a card needs to expose
             * what its data type is and what the data component is.
             *
             * The data component should be a simple object like this:
             * {
             *     id: object ID,
             *     type: typed object name (Genome, FBAModel, etc. Whatever's registered as the typed object name)
             *     workspace: <optional> the workspace name it's located in.
             * }
             *
             * It should be available as widget.getData()
             */

            var newCardId = "kblpc" + this.cardIndex;

            if (position === null) {
                position = {
                    my: "center",
                    at: "center",
                    of: "window"
                }
            }

            this.$elem.append("<div id='" + newCardId + "'/>");

            var newWidget = $("#" + newCardId)[cardName](options);

            var data = newWidget.getData();
            var cardTitle = data.title ? data.title : "";
            var cardSubtitle = data.id ? data.id : "";
            var cardWidth = newWidget.options.width ? newWidget.options.width : this.defaultWidth;
            var cardWorkspace = data.workspace ? data.workspace : this.defaultLocation;

            var cardOptions = {
                position: position,
                title: "<div>" + 
                       cardTitle + 
                       "</div>" +
                       "<div class='kblpc-subtitle'>" + 
                       cardSubtitle + 
                       "<span class='label label-primary pull-right'>" +
                       cardWorkspace + 
                       "</span></div>",
                width: cardWidth,
                id: newCardId,
            };

            if (newWidget.options.height)
                cardOptions.height = newWidget.options.height;

            var self = this;
            var newCard = $("#" + newCardId).LandingPageCard(cardOptions);

            this.cards[newCardId] = {
                card: newCard,
                widget: newWidget
            };

            this.cardIndex++;

            this.updateDataManager();
        },

        /**
         * Invoked when a card is closed - removes it from the set of cards that this manager knows about.
         */
        cardClosed: function(id) {
            delete this.cards[id];
            this.updateDataManager();
        },

        getDataObjectsHash: function() {
            var data = this.getDataObjects();
            // shuffle it into a hash of unique ids and a list of their workspaces.

            var dataHash = {};
            var self = this;
            $.each(data, function(i, obj) {
                // accessors to make this legible.
                var t = obj.type;
                var id = obj.id;

                var ws = obj.workspace;
                if (!ws)
                    ws = self.defaultLocation;

                var idStr = ws + ":" + id;
                if (dataHash[t]) {
                    if ($.inArray(idStr, dataHash[t]) === -1) {
                        dataHash[t].push(idStr);
                    }
                }
                else
                    dataHash[t] = [idStr];
            });

            return dataHash;
        },

        getDataObjects: function() {
            var data = [];
            for (var cardId in this.cards) {
                data.push(this.cards[cardId].widget.getData());
            }
            return data;
        },

        exportAllCardsToWorkspace: function(workspace) {
            for (var cardId in this.cards) {
                sendCardToWorkspace(cardId, workspace);
            }
        },

        exportCardToWorkspace: function(cardId, workspace) {
            this.cards[cardId].widget.exportToWorkspace(workspace);
        },

        /**
         * When the manager is destroyed, it needs to:
         * 1. Close all cards.
         * 2. Unregister all card events.
         * 3. Remove itself from the DOM.
         *
         * That third one might be more appropriate to occur outside of this widget, but here it is for now.
         */
        destroy: function() {
            for (var cardId in this.cards) {
                this.cards[cardId].card.LandingPageCard("close");
            }

            $(document).off("kbaseCardClosed");
            this.$elem.empty();
            this.cards = {};
            this.$elem.remove();

            for (var i=0; i<this.registeredEvents.length; i++) {
                $(document).off(this.registeredEvents[i]);
            }
            this.$controlBox.remove();
        },
    });
})( jQuery );