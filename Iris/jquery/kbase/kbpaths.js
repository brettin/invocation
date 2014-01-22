define('kbpaths',[], function (paths) {
 requirejs.config({
    //baseUrl: 'jquery/FUCK/',
    baseUrl : 'jquery/kbase/widgets',
    urlArgs: "bust=" + (new Date()).getTime(),
    paths : {
     jquery : '../../ext/jquery/jquery-1.10.2.min',
     jqueryui : '../../ext/jquery-ui/1.10.3/js/jquery-ui-1.10.3.custom.min',
     bootstrap : "../../ext/bootstrap/3.0.3/js/bootstrap.min",
     d3 : "../../ext/d3/d3.v3.min",
//     datavis : './jquery/kbase/datavis',
//     kbaseapi : './jquery/ui-js/kbase-api',
     kbwidget : '../kbwidget',

     kbaseVisWidget : '../widgets/kbaseVisWidget',
     kbaseHeatmap : '../widgets/vis/kbaseHeatmap',
     kbaseBarchart : '../widgets/vis/kbaseBarchart',
     kbaseScatterplot : '../widgets/vis/kbaseScatterplot',
     kbaseLinechart : '../widgets/vis/kbaseLinechart',
     kbasePiechart : '../widgets/vis/kbasePiechart',
     kbaseForcedNetwork : '../widgets/vis/kbaseForcedNetwork',

        //iris widgets
        iris              : 'iris/iris',
        kbaseIrisCommands : 'iris/kbaseIrisCommands',
        kbaseIrisContainerWidget : 'iris/kbaseIrisContainerWidget',
        kbaseIrisEchoWidget : 'iris/kbaseIrisEchoWidget',
        kbaseIrisFileBrowser : 'iris/kbaseIrisFileBrowser',
        kbaseIrisFileEditor : 'iris/kbaseIrisFileEditor',
        kbaseIrisGrammar : 'iris/kbaseIrisGrammar',
        kbaseIrisGUIWidget : 'iris/kbaseIrisGUIWidget',
        kbaseIrisProcessList : 'iris/kbaseIrisProcessList',
        kbaseIrisTerminal : 'iris/kbaseIrisTerminal',
        kbaseIrisTerminalWidget : 'iris/kbaseIrisTerminalWidget',
        kbaseIrisTextWidget : 'iris/kbaseIrisTextWidget',
        kbaseIrisTutorial : 'iris/kbaseIrisTutorial',
        kbaseIrisWidget : 'iris/kbaseIrisWidget',
        kbaseIrisWorkspace : 'iris/kbaseIrisWorkspace',

        forceDirectedNetwork : 'networks/force-directed',

        RGBColor : '../../../js/RGBColor',
        geometry_point : '../../../js/geometry/point',
        geometry_rectangle : '../../../js/geometry/rectangle',
        geometry_size : '../../../js/geometry/size',
    },
    shim: {
        bootstrap:    { deps: ["jquery"] },
    }
 });
});


