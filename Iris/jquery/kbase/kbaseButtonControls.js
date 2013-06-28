/*
    control to tack on arbitrary command groups to any container element.
    This lets you mouse over and display buttons (with icons) in the upper right.

    $('#some_div').kbaseButtonControls(
        {
            //list of controls to populate buttons on the right end of the title bar. Give it an icon
            //and a callback function.
            onMouseover : true,
            controls : [
                {
                    icon : 'icon-search',
                    'icon-alt' : 'icon-search-alt', //optional. Toggle icon between icon and icon-alt when clicked.
                    callback : function(e) {
                        console.log("clicked on search");
                    },
                    id : 'search' //optional. Keys the button to be available via $('#some_div').controls('search')
                },
                {
                    icon : 'icon-minus',
                    callback : function(e) {
                        console.log("clicked on delete");
                    }
                },
            ],
        }
    );
*/

(function( $, undefined ) {

    $.kbWidget("kbaseButtonControls", 'kbaseWidget', {
        version: "1.0.0",
        options: {
            controls : [],
            onMouseover : true,
        },

        init: function(options) {

            this._super(options);

            this._controls = {};

            this.appendUI( $( this.$elem ) );

            return this;

        },

        appendUI : function ($elem) {

            $elem
                .css('position', 'relative')
                .prepend(
                    $('<div></div>')
                        .addClass('btn-group')
                        .attr('id', 'control-buttons')
                        .css('right', '0px')
                        .css('top', '0px')
                        .css('position', 'absolute')
                        .css('margin-right', '3px')
                )
            ;

            this._rewireIds($elem, this);

            if (this.options.onMouseover) {
                $elem
                    .mouseover(
                        function(e) {
                            $(this).children().first().show();
                        }
                    )
                    .mouseout(
                        function(e) {
                            $(this).children().first().hide();
                        }
                    )
                    .children().first().hide();
            };

            this.setControls(this.options.controls);

            return this;

        },

        controls : function (control) {
            if (control) {
                return this._controls[control];
            }
            else {
                return this._controls;
            }
        },

        setControls : function (controls) {
            this.data('control-buttons').empty();
            for (control in this._controls) {
                this._controls[control] = undefined;
            }

            var $box = this;

            $.each(
                controls,
                $.proxy(function (idx, val) {

                    var btnClass = 'btn btn-mini';
                    if (val.type) {
                        btnClass = btnClass + ' btn-' + val.type;
                    }

                    var $button =
                        $('<button></button>')
                            .attr('href', '#')
                            .css('padding-top', '1px')
                            .css('padding-bottom', '1px')
                            .attr('class', btnClass)
                            .append($('<i></i>').addClass(val.icon))
                            .tooltip({title : val.tooltip})
                            .bind('click',
                                function(e) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    console.log(this);
                                    if (val['icon-alt']) {
                                        $(this).children().first().toggleClass(val.icon);
                                        $(this).children().first().toggleClass(val['icon-alt']);
                                    }
                                    val.callback.call(this, e, $box);
                                }
                            )
                    ;

                    if (val.id) {
                        this._controls[val.id] = $button;
                    }

                    this.data('control-buttons').append($button);
                },this)
            );
        },


    });

}( jQuery ) );
