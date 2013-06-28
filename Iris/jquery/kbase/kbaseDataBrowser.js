/*


*/

(function( $, undefined ) {


    $.kbWidget("kbaseDataBrowser", 'kbaseWidget', {
        version: "1.0.0",
        /*options: {
            'root' : '/',
            'controls' : true,
            'externalControls' : true,
            'height' : '110px',
            'tallHeight' : '450px',
            'shouldToggleNavHeight' : true,
            'controlButtons' : ['deleteButton', 'viewButton', 'addDirectoryButton', 'uploadButton', 'addButton'],
            'name' : 'File Browser',
            'openFolderIcon' : 'icon-folder-open-alt',
            'closedFolderIcon' : 'icon-folder-close-alt',
            'fileIcon' : 'icon-file',
        },*/
        options : {
            'title' : 'Data Browser',
            'canCollapse' : true,
            'height' : '200px',
            'types' : {
                'file' : {
                    'icon' : 'icon-file',
                },
                'folder' : {
                    'icon' : 'icon-folder-close-alt',
                    'icon-open' : 'icon-folder-open-alt',
                    'expandable' : true,
                }
            },
            'typeControls' : {},
            'content' : [],
        },

        init: function (options) {

            this._super(options);

            this.appendUI(this.$elem);

            return this;

        },

        sortByName : function (a,b) {
                 if (a['name'].toLowerCase() < b['name'].toLowerCase()) { return -1 }
            else if (a['name'].toLowerCase() > b['name'].toLowerCase()) { return 1  }
            else                            { return 0  }
        },


        appendContent : function (content, $target) {

            $.each(
                content,
                $.proxy( function (idx, val) {

                    var icon = val.icon;
                    var iconOpen = val['icon-open'];

                    if (icon == undefined && val.type != undefined) {
                        icon = this.options.types[val.type].icon;
                        iconOpen = this.options.types[val.type]['icon-open'];
                    }

                    if (val.expandable == undefined && val.type != undefined) {
                        val.expandable = this.options.types[val.type].expandable;
                    }

                    var $button =
                        $('<i></i>')
                            .addClass(val.open ? iconOpen : icon)
                            .css('color', 'gray')
                    ;

                    var $li = $('<li></li>')
                        .attr('id', val.id)
                        .append(
                            $('<a></a>')
                                .append($button)
                                .append(' ')
                                .append(val.label)
                        );

                    $target.append($li);

                    if (val.expandable) {
                        var $ul =
                            $('<ul></ul>')
                                .addClass('nav nav-list')
                        ;

                        if (! val.open) {
                            $ul.hide();
                        }

                        if (val.children != undefined) {
                            this.appendContent(val.children, $ul);
                        }
                        $target.append($ul);

                        var callback = val.childrenCallback;
                        if (val.children == undefined && callback == undefined && val.type != undefined) {
                            callback = this.options.types[val.type].childrenCallback;
                        }

                        $li.bind('click',
                            $.proxy(function(e) {
                                e.preventDefault(); e.stopPropagation();
                                $button.toggleClass(iconOpen);
                                $button.toggleClass(icon);
                                if ($ul.is(':hidden') && callback != undefined) {
                                    callback.call(this, val, $.proxy(function(results) {
                                        $ul.empty();
                                        this.appendContent(results, $ul);
                                        $ul.toggle('collapse')
                                    }, this));
                                }
                                else {
                                    $ul.toggle('collapse');
                                }
                            }, this)
                        );

                    }

                    var controls = val.controls;
                    if (controls == undefined && val.type != undefined) {
                        controls = this.options.typeControls[val.type];
                    }

                    if (controls) {
                        $li.kbaseButtonControls(
                            {
                                controls : controls
                            }
                        );
                    }


                }, this)
            );

            this._rewireIds($target, this);

            return $target;

        },

        prepareRootContent : function() {
            return $('<ul></ul>')
                .addClass('nav nav-list')
                .css('height', this.options.height)
                .css('overflow', 'auto')
                .attr('id', 'ul-nav')
            ;
        },

        appendUI : function ($elem) {

            var $root = this.prepareRootContent();

            this._rewireIds($root, this);

            this.appendContent(this.options.content, this.data('ul-nav'));

            $elem.kbaseBox(
                {
                    title : this.options.title,
                    canCollapse : this.options.canCollapse,
                    content : $root,
                    postcontent : this.options.postcontent
                }
            );

            return $elem;
        },

/*        selected : function( path ) {

        },

        displayPath : function(path, $ul, filelist) {

            var $fb = this;

            $ul.empty();


        },

        fileBrowserContainer : function() {
            var navHeight = this.options.height;

            var $ul = $('<ul></ul>')
                .addClass('nav nav-list')
                .css('height', navHeight)
                .css('overflow', 'auto')
                .attr('id', 'ul-nav')
            ;

            var $container =
                $('<div></div>')
                    .append($ul);

            this.data('file-ul', $ul);

            return $container;
        },

        fileBrowserControls : function() {
            var $div =
                $('<div></div>')
                    .addClass('btn-toolbar')
                    .addClass('text-right')
                    .append(
                        $('<div></div>')
                            .addClass('btn-group')
                            .attr('id', 'control-buttons')
                            .append(
                                $('<input></input>')
                                    .attr('type', 'file')
                                    .attr('id', 'fileInput')
                                    .css('display', 'none')
                                    .bind( 'change', jQuery.proxy(this.handleFileSelect, this) )
                            )
                    )
            ;
            return $div;
        },

        appendUI : function($elem) {

            var $container = this.fileBrowserContainer();

            var $box = $('<div></div>').kbaseBox(
                {
                    title : this.options.name,
                    canCollapse: true,  //boolean. Whether or not clicking the title bar collapses the box
                    content: $container,//'Moo. We are a box. Take us to China.',  //The content within the box. Any HTML string or jquery element
                    //optional list of controls to populate buttons on the right end of the title bar. Give it an icon
                    //and a callback function.
                }
            );

            $elem.append($box.$elem);

            if (this.options.controls) {
                if (this.options.externalControls) {
                    $container.parent().parent().append(this.fileBrowserControls());
                }
                else {
                    $container.append(this.fileBrowserControls());
                }
            }

            this._rewireIds($box.$elem, this);

            $.each(
                this.options.controlButtons,
                $.proxy( function (idx, val) {
                    this.data('control-buttons').append(
                        this[val]()
                    );
                }, this)
            );

            this._rewireIds($box.$elem, this);

            this.listDirectory(this.options.root, this.data('file-ul'));
            this.disableButtons();

            return this;

        },

        disableButtons : function() {
            this.toggleButtons('N');
        },

        enableButtons : function(flag) {
            this.toggleButtons(flag);
        },

        toggleButtons : function(flag) {

            $.each(
                this.options.controlButtons,
                $.proxy(function (idx, val) {
                    var $button = this[val]();
                    if ($button == undefined) {
                        return;
                    }
                    var require = $button.data('require');
                    if (require != undefined) {
                        if ((require == 'a' && flag != 'N') || require == flag) {
                            $button.removeClass('disabled');
                        }
                        else {
                            $button.addClass('disabled');
                        }
                    }
                }, this)
            );
        },


        listDirectory : function (path, $ul) {
             throw "Cannot call listDirectory directly - please subclass";
        },
*/

    });

}( jQuery ) );
