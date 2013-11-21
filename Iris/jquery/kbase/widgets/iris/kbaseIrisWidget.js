/*


*/

(function( $, undefined ) {


    $.KBWidget(
        {

            name: "kbaseIrisWidget",
            parent: 'kbaseAuthenticatedWidget',

            version: "1.0.0",
            _accessors : [
                'promise',
                {name : 'pid', setter : 'setPid'},
                {name : 'input', setter : 'setInput'},
                {name : 'output', setter : 'setOutput'},
                {name : 'error', setter : 'setError'},
                {name : 'value', setter : 'setValue'},
                {name : 'cwd', setter : 'setCwd'},
                {name : 'subCommand', setter : 'setSubCommand'},
            ],
            options: {

            },

            init: function(options) {

                this._super(options);

                this.appendUI( $( this.$elem ) );

                return this;

            },

            setSubCommand : function(subCommand) {
                this.setValueForKey('subCommand', subCommand);
            },

            setPid : function(newVal) {
                this.setValueForKey('pid', newVal);
            },

            setValue : function(newVal) {
                this.setValueForKey('value', newVal);
            },

            setInput : function (newVal) {
                this.setEscapedText('input', newVal);
            },

            setOutput : function (newVal) {
                this.setEscapedText('output', newVal);
            },

            setError : function (newVal) {
                this.setEscapedText('error', newVal);
            },

            setCwd : function (newVal) {
                this.setEscapedText('cwd', newVal);
            },

            escapeText : function (newVal) {
                if (typeof newVal == 'string') {
                    newVal = newVal.replace(/</g, '&lt;');
                    newVal = newVal.replace(/>/g, '&gt;');
                    newVal = $.jqElem('span')
                        .append(
                            $.jqElem('span')
                            .css('white-space', 'pre')
                            .append(newVal)
                        );
                }
                else {
                    newVal = $.jqElem('span').append(newVal);
                }

                return newVal;
            },

            setEscapedText : function (key, newVal) {
                newVal = this.escapeText(newVal);
                this.setValueForKey(key, newVal);
            },

            viewOutput : function() {

                var win = window.open();
                win.document.open();
                var output =
                    $.jqElem('div')
                        .append(
                            $.jqElem('div')
                                .css('white-space', 'pre')
                                .css('font-family' , 'monospace')
                                .append(
                                    this.output().clone()
                                )
                        )
                ;
                $.each(
                    output.find('a'),
                    function (idx, val) {
                        $(val).replaceWith($(val).html());
                    }
                );

                win.document.write(output.html());
                win.document.close();
            },

            acceptInput : function($widget) {

                this.kb_bind(
                    $widget,
                    'value',
                    function (e, $target, vals) {
                        this.setInput(vals.newValue);
                        this.render();
                    }
                );
            },

            startThinking : function() {},
            stopThinking : function() {},

        }

    );

}( jQuery ) );
