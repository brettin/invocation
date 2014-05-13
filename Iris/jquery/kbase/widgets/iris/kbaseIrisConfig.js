/*


*/

define('kbaseIrisConfig',
    function() {
        if (window.kbaseIrisConfig == undefined) {
            window.kbaseIrisConfig = {
                terminal : {
                    invocationURL   : 'http://kbase.us/services/invocation',
                    searchURL       : 'https://kbase.us/services/search-api/search/$category/$keyword?start=$start&count=$count&format=json',
                    run_dispatch    : [],
                },
                tutorial : {
                    config_url : 'http://kbase.us/docs/tutorials.cfg',
                    default_tutorial : 'http://kbase.us/docs/getstarted/getstarted_iris/getstarted_iris.html',
                },
            }
        }
    }
);
